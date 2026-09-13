import secrets
import hmac
import hashlib
import os
import threading
from flask import Blueprint, request, jsonify, redirect, current_app, g
import requests as http_requests
from functools import wraps
from database.mongodb import user_service, repo_service, pr_service
from auth.jwt_auth import create_access_token, decode_token
from ml.severity_classifier import SeverityClassifier

github_bp = Blueprint('github', __name__)

# Webhook idempotency guard (in-memory; production should use Redis/DB)
_processed_deliveries: set[str] = set()

ml_classifier = SeverityClassifier()
ml_classifier.load()


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        else:
            token = request.args.get('token')
            
        if not token:
            return jsonify({"error": "Authentication required"}), 401
            
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated


@github_bp.route('/api/github/oauth/authorize', methods=['GET'])
@token_required
def github_authorize():
    client_id = current_app.config.get('GITHUB_CLIENT_ID')
    if not client_id:
        return jsonify({"error": "GitHub OAuth not configured"}), 500

    state = secrets.token_urlsafe(32)
    from flask import session
    session['github_oauth_state'] = state
    session['github_oauth_user'] = g.current_user['user_id']

    scopes = "repo,user,read:org"
    callback_url = current_app.config.get('GITHUB_OAUTH_CALLBACK_URL', 'http://localhost:5000/api/github/oauth/callback')
    auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope={scopes}&state={state}&redirect_uri={callback_url}"
    return jsonify({"auth_url": auth_url, "state": state})


@github_bp.route('/api/github/oauth/callback', methods=['GET'])
def github_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    if error:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/github?error={error}")

    from flask import session
    stored_state = session.get('github_oauth_state')
    user_id = session.get('github_oauth_user')

    if not stored_state or stored_state != state:
        return jsonify({"error": "Invalid OAuth state"}), 400

    client_id = current_app.config.get('GITHUB_CLIENT_ID')
    client_secret = current_app.config.get('GITHUB_CLIENT_SECRET')

    token_response = http_requests.post(
        "https://github.com/login/oauth/access_token",
        json={"client_id": client_id, "client_secret": client_secret, "code": code, "state": state},
        headers={"Accept": "application/json"},
        timeout=10,
    )

    if token_response.status_code != 200:
        return jsonify({"error": "Failed to exchange OAuth code"}), 500

    token_data = token_response.json()
    access_token = token_data.get('access_token')
    if not access_token:
        return jsonify({"error": "No access token received"}), 500

    gh_client_response = http_requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}", "Accept": "application/vnd.github.v3+json"},
        timeout=10,
    )

    if gh_client_response.status_code != 200:
        return jsonify({"error": "Failed to get GitHub user info"}), 500

    gh_user = gh_client_response.json()

    if user_id:
        user_service.update_user(user_id, {
            "github_id": gh_user["id"],
            "github_username": gh_user["login"],
            "github_token": access_token,
            "avatar_url": gh_user.get("avatar_url")
        })

    session.pop('github_oauth_state', None)
    session.pop('github_oauth_user', None)

    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    return redirect(f"{frontend_url}/github?github_connected=true")


@github_bp.route('/api/github/status', methods=['GET'])
@token_required
def github_status():
    user = user_service.get_user_by_id(g.current_user['user_id'])
    connected = bool(user and user.github_token)
    return jsonify({
        "connected": connected,
        "github_username": user.github_username if user else None,
        "avatar_url": user.avatar_url if user else None
    })


@github_bp.route('/api/github/pat/connect', methods=['POST'])
@token_required
def github_pat_connect():
    data = request.get_json()
    pat_token = data.get('token', '').strip()
    if not pat_token:
        return jsonify({"error": "Token is required"}), 400

    try:
        gh_response = http_requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {pat_token}", "Accept": "application/vnd.github.v3+json"},
            timeout=10,
        )
        if gh_response.status_code != 200:
            return jsonify({"error": "Invalid GitHub token"}), 400

        gh_user = gh_response.json()
        user_service.update_user(g.current_user['user_id'], {
            "github_id": gh_user["id"],
            "github_username": gh_user["login"],
            "github_token": pat_token,
            "avatar_url": gh_user.get("avatar_url")
        })

        return jsonify({
            "message": "GitHub connected successfully",
            "github_username": gh_user["login"]
        })
    except Exception as e:
        current_app.logger.error(f"PAT connect failed: {e}")
        return jsonify({"error": "Failed to connect GitHub"}), 500


@github_bp.route('/api/github/disconnect', methods=['POST'])
@token_required
def github_disconnect():
    user_service.update_user(g.current_user['user_id'], {
        "github_id": None,
        "github_username": None,
        "github_token": None,
        "avatar_url": None
    })
    return jsonify({"message": "GitHub account disconnected"})


@github_bp.route('/api/github/repos', methods=['GET'])
@token_required
def list_repos():
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400

    try:
        from services.github_client import GitHubClient
        client = GitHubClient(user.github_token)
        repos = client.get_user_repos()

        db_repos = []
        for repo_data in repos:
            repo_info = {
                "id": repo_data["id"],
                "name": repo_data["name"],
                "full_name": repo_data["full_name"],
                "description": repo_data.get("description"),
                "language": repo_data.get("language"),
                "default_branch": repo_data.get("default_branch", "main"),
                "private": repo_data.get("private", False),
                "stargazers_count": repo_data.get("stargazers_count", 0),
                "forks_count": repo_data.get("forks_count", 0),
                "updated_at": repo_data.get("updated_at"),
            }
            db_repos.append(repo_info)

        return jsonify({"repos": db_repos})
    except Exception as e:
        current_app.logger.error(f"Failed to fetch repos: {e}")
        return jsonify({"error": "Failed to fetch repositories"}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>', methods=['GET'])
@token_required
def get_repo_info_route(repo_full_name):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400

    try:
        from services.github_client import GitHubClient
        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)
        repo_info = client.get_repo_info()
        return jsonify(repo_info)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch repo info: {e}")
        return jsonify({"error": "Failed to fetch repository information"}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>/branches', methods=['GET'])
@token_required
def list_branches(repo_full_name):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400

    try:
        from services.github_client import GitHubClient
        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)
        branches = client.get_repo_branches()
        return jsonify({"branches": [{"name": b["name"], "commit_sha": b.get("commit", {}).get("sha")} for b in branches]})
    except Exception as e:
        current_app.logger.error(f"Failed to fetch branches: {e}")
        return jsonify({"error": "Failed to fetch branches"}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>/pull-requests', methods=['GET'])
@token_required
def list_pull_requests(repo_full_name):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400

    try:
        from services.github_client import GitHubClient
        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)
        prs = client.get_pull_requests()
        return jsonify({"pull_requests": [{
            "number": pr["number"],
            "title": pr["title"],
            "body": pr.get("body", ""),
            "author": pr.get("user", {}).get("login", "unknown"),
            "author_avatar": pr.get("user", {}).get("avatar_url"),
            "head_sha": pr.get("head", {}).get("sha", ""),
            "head_branch": pr.get("head", {}).get("ref", ""),
            "base_branch": pr.get("base", {}).get("ref", "main"),
            "state": pr.get("state", "open"),
            "changed_files": pr.get("changed_files", 0),
            "additions": pr.get("additions", 0),
            "deletions": pr.get("deletions", 0),
            "created_at": pr.get("created_at"),
            "updated_at": pr.get("updated_at"),
            "html_url": pr.get("html_url"),
            "user": pr.get("user"),
        } for pr in prs]})
    except Exception as e:
        current_app.logger.error(f"Failed to fetch PRs: {e}")
        return jsonify({"error": "Failed to fetch pull requests"}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>/pull-requests/<int:pr_number>', methods=['GET'])
@token_required
def get_pr(repo_full_name, pr_number):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400
    try:
        from services.github_client import GitHubClient
        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)
        pr = client.get_pr_details(pr_number)
        return jsonify({
            "number": pr["number"], "title": pr["title"], "body": pr.get("body",""),
            "author": pr.get("user",{}).get("login","unknown"), "author_avatar": pr.get("user",{}).get("avatar_url"),
            "state": pr.get("state"), "html_url": pr.get("html_url"),
            "head_branch": pr.get("head",{}).get("ref"), "base_branch": pr.get("base",{}).get("ref"),
            "head_sha": pr.get("head",{}).get("sha"), "base_sha": pr.get("base",{}).get("sha"),
            "additions": pr.get("additions"), "deletions": pr.get("deletions"), "changed_files": pr.get("changed_files"),
            "created_at": pr.get("created_at"), "updated_at": pr.get("updated_at"),
            "user": pr.get("user"), "head": pr.get("head"), "base": pr.get("base")
        })
    except Exception as e:
        current_app.logger.error(f"Failed to fetch PR details: {e}")
        return jsonify({"error": "Failed to fetch PR details"}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>/pull-requests/<int:pr_number>/files', methods=['GET'])
@token_required
def get_pr_files(repo_full_name, pr_number):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400
    try:
        from services.github_client import GitHubClient
        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)
        files = client.get_pull_request_files(pr_number)
        supported = []
        for f in files:
            filename = f.get("filename","")
            is_python = filename.endswith(".py")
            supported.append({
                "filename": filename, "status": f.get("status"), "additions": f.get("additions",0),
                "deletions": f.get("deletions",0), "changes": f.get("changes",0),
                "patch": f.get("patch","")[:3000] if f.get("patch") else None,
                "supported": is_python, "skip_reason": None if is_python else "Unsupported file type — skipped. Only Python (.py) is analyzed."
            })
        return jsonify({"files": supported, "total": len(supported)})
    except Exception as e:
        current_app.logger.error(f"Failed to fetch PR files: {e}")
        return jsonify({"error": "Failed to fetch PR files"}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>/pull-requests/<int:pr_number>/comment', methods=['POST'])
@token_required
def post_pr_comment(repo_full_name, pr_number):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400
    data = request.get_json(silent=True) or {}
    # Expect either scan_id or raw body
    try:
        from database.mongodb import scan_service
        from reviewer.github_commenter import GitHubCommenter
        from services.github_client import GitHubClient
        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)
        scan_id = data.get("scan_id") or data.get("request_id")
        if scan_id:
            scan = scan_service.get_scan_by_id(scan_id) or scan_service.get_scan_by_request_id(scan_id)
            if not scan:
                return jsonify({"error": "Scan not found"}), 404
            # Build comment from scan
            from models.review import ReviewResponse
            resp = ReviewResponse(request_id=scan.request_id, file_analyses=scan.file_analyses, summary=scan.summary, ai_review=scan.ai_review)
            commenter = GitHubCommenter(client)
            body = commenter.format_review_comment(resp)
        else:
            body = data.get("body")
            if not body:
                return jsonify({"error": "body or scan_id required"}), 400
        result = client.create_pr_comment(pr_number, body)
        return jsonify({"message": "Review posted successfully.", "comment_url": result.get("html_url")})
    except Exception as e:
        current_app.logger.error(f"Failed to post PR comment: {e}")
        return jsonify({"error": "Failed to post review."}), 500


@github_bp.route('/api/github/repos/<path:repo_full_name>/pull-requests/<int:pr_number>/analyze', methods=['POST'])
@token_required
def analyze_pull_request(repo_full_name, pr_number):
    user = user_service.get_user_by_id(g.current_user['user_id'])
    if not user or not user.github_token:
        return jsonify({"error": "GitHub not connected"}), 400

    try:
        from services.github_client import GitHubClient
        from analyzers.security_analyzer import SecurityAnalyzer
        from analyzers.smell_analyzer import SmellAnalyzer
        from analyzers.complexity_analyzer import ComplexityAnalyzer
        from analyzers.performance_analyzer import PerformanceAnalyzer
        from reviewer.ai_reviewer import AIReviewer
        from reviewer.aggregator import FindingAggregator
        from models.review import ReviewResponse, FileAnalysis, AnalysisSummary, Issue
        import uuid
        import time

        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)

        pr_details = client.get_pr_details(pr_number)
        files = client.get_pull_request_files(pr_number)
        # Preserve patch for AI context (diff) while filtering supported files
        files_by_name = {f['filename']: f for f in files}
        python_files = [f for f in files if f['filename'].endswith('.py')]
        non_python_files = [f for f in files if not f['filename'].endswith('.py')]
        # PR size protection: limit to 20 Python files
        if len(python_files) > 20:
            current_app.logger.warning(f"PR #{pr_number} has {len(python_files)} Python files, truncating to 20")
            python_files = python_files[:20]

        security_analyzer = SecurityAnalyzer()
        smell_analyzer = SmellAnalyzer()
        complexity_analyzer = ComplexityAnalyzer()
        performance_analyzer = PerformanceAnalyzer()
        ai_reviewer = AIReviewer()
        aggregator = FindingAggregator()

        all_file_analyses = []
        all_issues = []

        for file_info in python_files:
            filename = file_info['filename']
            content = client.get_file_content(filename, pr_details['head']['sha'])
            if not content:
                continue

            sec_issues = security_analyzer.analyze(content, filename)
            smell_issues = smell_analyzer.analyze(content, filename)
            comp_issues = complexity_analyzer.analyze(content, filename)
            perf_issues = performance_analyzer.analyze(content, filename)

            raw_file_issues = sec_issues.issues + smell_issues + comp_issues + perf_issues
            file_issues = aggregator.merge_findings(raw_file_issues)
            
            # Predict severity using ML
            for issue in file_issues:
                try:
                    ai_reviewer.enhance_issue_with_nlp(issue, content[:2000])
                    if "codebert" not in issue.source:
                        issue.source.append("codebert")
                except Exception:
                    issue.explanation = issue.message
                    issue.fix_suggestion = issue.suggestion or "Review this issue and apply appropriate fixes."

                try:
                    ml_issue = {
                        "type": issue.type.value,
                        "severity": issue.severity.value,
                        "line_number": issue.line_number,
                        "message": issue.message,
                        "rule_id": issue.rule_id or "",
                        "suggestion": issue.suggestion,
                        "code_snippet": issue.code_snippet,
                        "explanation": issue.explanation,
                    }
                    ml_result = ml_classifier.predict([ml_issue])[0]
                    if ml_classifier.is_trained:
                        issue.ml_severity = ml_result["ml_severity"]
                        issue.ml_confidence = ml_result["ml_confidence"]
                        issue.ml_model_version = ml_result.get("ml_model_version")
                        if "ml" not in issue.source:
                            issue.source.append("ml")
                except Exception:
                    pass

            all_issues.extend(file_issues)

            fa = FileAnalysis(
                file_path=filename,
                language="python",
                lines_of_code=len(content.split('\n')),
                issues=file_issues
            )
            all_file_analyses.append(fa)
            
        for file_info in non_python_files:
            fa = FileAnalysis(
                file_path=file_info['filename'],
                language="unknown",
                lines_of_code=0,
                issues=[]
            )
            all_file_analyses.append(fa)

        by_type = {}
        by_severity = {}
        for issue in all_issues:
            by_type[issue.type.value] = by_type.get(issue.type.value, 0) + 1
            by_severity[issue.severity.value] = by_severity.get(issue.severity.value, 0) + 1

        overall_risk = "none"
        if by_severity.get("critical", 0) > 0:
            overall_risk = "critical"
        elif by_severity.get("high", 0) > 0:
            overall_risk = "high"
        elif by_severity.get("medium", 0) > 0:
            overall_risk = "medium"
        elif by_severity.get("low", 0) > 0:
            overall_risk = "low"

        summary = AnalysisSummary(
            total_issues=len(all_issues),
            by_type=by_type,
            by_severity=by_severity,
            overall_risk=overall_risk,
            file_path=repo_full_name
        )

        # Build AI context from actual diff (patch) where available, fallback to file content
        code_sample = f"PR: {repo_full_name} #{pr_number}\n{pr_details.get('title','')}\n{pr_details.get('body','')[:500]}\n\nDiff:\n"
        for file_info in python_files[:3]:
            patch = files_by_name.get(file_info['filename'], {}).get('patch')
            content_source = patch if patch else ""
            if not content_source:
                # fallback fetch full content if no patch
                try:
                    content_source = client.get_file_content(file_info['filename'], pr_details['head']['sha']) or ""
                except Exception:
                    content_source = ""
            if content_source:
                truncated = content_source[:2500] + ("\n# ... truncated" if len(content_source) > 2500 else "")
                code_sample += f"\n# {file_info['filename']}\n{truncated}\n"

        # Structured AI review with fallback
        try:
            ai_res = ai_reviewer.review_code_structured(code_sample, repo_full_name, all_issues)
            ai_review = ai_res.get("summary") or ai_res.get("raw") or "AI review unavailable; static analysis completed."
            ai_available = ai_res.get("ai_available", False)
            ai_error = ai_res.get("error")
            ai_model = ai_res.get("model")
            ai_structured = {"issues": ai_res.get("issues", []), "recommendations": ai_res.get("recommendations", []), "raw": ai_res.get("raw")}
        except Exception as e:
            current_app.logger.error(f"AI structured review failed in PR analysis: {e}")
            ai_review = "AI review unavailable; static analysis completed."
            ai_available = False
            ai_error = str(e)
            ai_model = getattr(ai_reviewer, "model", None)
            ai_structured = None

        response = ReviewResponse(
            request_id=str(uuid.uuid4()),
            file_analyses=all_file_analyses,
            summary=summary,
            ai_review=ai_review,
            ai_available=ai_available,
            ai_error=ai_error,
            ai_model=ai_model,
            ai_structured=ai_structured,
            processing_time_ms=0
        )

        from database.mongodb import scan_service, ScanRecord, FileAnalysis as MongoFileAnalysis, AnalysisSummary as MongoAnalysisSummary
        scan = ScanRecord(
            user_id=user.id,
            request_id=response.request_id,
            file_analyses=[MongoFileAnalysis.model_validate(fa.model_dump()) for fa in all_file_analyses],
            summary=MongoAnalysisSummary.model_validate(summary.model_dump()),
            ai_review=ai_review,
            ai_available=ai_available,
            ai_error=ai_error,
            ai_model=ai_model,
            ai_structured=ai_structured,
            github_pr_url=f"https://github.com/{repo_full_name}/pull/{pr_number}",
            github_pr_number=pr_number,
            github_repo=repo_full_name,
            processing_time_ms=response.processing_time_ms
        )
        scan_service.create_scan(scan)

        req_data = request.get_json(silent=True) or {}
        post_comment = req_data.get('post_comment', False)
        if post_comment:
            from reviewer.github_commenter import GitHubCommenter
            commenter = GitHubCommenter(client)
            comment_body = commenter.format_review_comment(response)
            client.create_pr_comment(pr_number, comment_body)

        return jsonify({
            "message": "Analysis completed",
            "request_id": response.request_id,
            "files_reviewed": len(all_file_analyses),
            "total_issues": len(all_issues),
            "overall_risk": overall_risk,
            "summary": summary.model_dump(),
            "ai_review": ai_review,
            "ai_available": ai_available,
            "ai_error": ai_error,
            "ai_model": ai_model,
            "ai_structured": ai_structured,
        })

    except Exception as e:
        current_app.logger.error(f"Failed to analyze PR: {e}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


@github_bp.route('/api/github/webhook', methods=['POST'])
def github_webhook():
    """Canonical GitHub webhook endpoint. Validates HMAC SHA-256 and triggers async PR review."""
    from database.mongodb import user_service

    secret = os.environ.get("GITHUB_WEBHOOK_SECRET") or current_app.config.get("GITHUB_WEBHOOK_SECRET")
    if secret:
        signature = request.headers.get("X-Hub-Signature-256")
        if not signature:
            return jsonify({"error": "Missing signature"}), 400
        
        mac = hmac.new(secret.encode(), msg=request.data, digestmod=hashlib.sha256)
        expected_signature = "sha256=" + mac.hexdigest()
        if not hmac.compare_digest(expected_signature, signature):
            return jsonify({"error": "Invalid signature"}), 403

    # Idempotency: GitHub delivery ID
    delivery_id = request.headers.get("X-GitHub-Delivery")
    if delivery_id:
        if delivery_id in _processed_deliveries:
            return jsonify({"message": "Duplicate delivery ignored"}), 200
        # Keep set bounded to 1000 entries
        if len(_processed_deliveries) > 1000:
            _processed_deliveries.clear()
        _processed_deliveries.add(delivery_id)

    event = request.headers.get("X-GitHub-Event")
    if event == "ping":
        return jsonify({"message": "pong"}), 200
    
    if event != "pull_request":
        return jsonify({"message": "Ignored event"}), 200

    payload = request.get_json(silent=True) or {}
    action = payload.get("action")
    sender = payload.get("sender", {}).get("login", "")
    repo_full_name = payload.get("repository", {}).get("full_name")
    owner_login = payload.get("repository", {}).get("owner", {}).get("login")

    # Webhook loop protection: ignore events caused by bots to prevent infinite loops
    if sender:
        lower_sender = sender.lower()
        if "bot" in lower_sender or "[bot]" in sender or sender == "intellireview-ai":
            return jsonify({"message": "Ignored bot event to prevent loop"}), 200
        # Ignore events triggered by our own bot comments or by synchronize from bot pushes
        pr_user = payload.get("pull_request", {}).get("user", {}).get("login", "")
        if pr_user and sender == owner_login and sender == pr_user:
            # Sender is both repo owner and PR author in a bot-like context — still process but avoid duplicate
            pass

    if action not in ["opened", "synchronize", "reopened"]:
        return jsonify({"message": f"Ignored PR action: {action}"}), 200

    pr_number = payload.get("pull_request", {}).get("number")

    if not repo_full_name or not pr_number:
        return jsonify({"error": "Invalid payload"}), 400

    # Find a user to act on behalf of (the repo owner or any user with a token for now)
    user = user_service.collection.find_one({"github_username": owner_login})
    if not user:
        # Fallback to the sender or any admin user (simplification for single-tenant / prototype)
        user = user_service.collection.find_one({"github_token": {"$ne": None}})
        
    if not user or not user.get("github_token"):
        return jsonify({"error": "No user token available to process webhook"}), 500

    github_token = user["github_token"]
    user_id = str(user["_id"])

    # Define the background task
    def process_pr_async(app, repo_full_name, pr_number, token, uid):
        with app.app_context():
            try:
                from services.github_client import GitHubClient
                from analyzers.security_analyzer import SecurityAnalyzer
                from analyzers.smell_analyzer import SmellAnalyzer
                from analyzers.complexity_analyzer import ComplexityAnalyzer
                from analyzers.performance_analyzer import PerformanceAnalyzer
                from reviewer.ai_reviewer import AIReviewer
                from reviewer.aggregator import FindingAggregator
                from reviewer.github_commenter import GitHubCommenter
                from models.review import ReviewResponse, FileAnalysis, AnalysisSummary
                from database.mongodb import scan_service, ScanRecord, FileAnalysis as MongoFileAnalysis, AnalysisSummary as MongoAnalysisSummary
                import uuid

                owner, name = repo_full_name.split("/", 1)
                client = GitHubClient(token, owner, name)
                
                pr_details = client.get_pr_details(pr_number)
                files = client.get_pull_request_files(pr_number)
                files_by_name_bg = {f['filename']: f for f in files}
                python_files = [f for f in files if f['filename'].endswith('.py')]

                if not python_files:
                    return
                # PR size protection: limit to 20 Python files max
                if len(python_files) > 20:
                    app.logger.warning(f"PR #{pr_number} has {len(python_files)} Python files, truncating to 20")
                    python_files = python_files[:20]

                security_analyzer = SecurityAnalyzer()
                smell_analyzer = SmellAnalyzer()
                complexity_analyzer = ComplexityAnalyzer()
                performance_analyzer = PerformanceAnalyzer()
                ai_reviewer = AIReviewer()
                aggregator = FindingAggregator()

                all_file_analyses = []
                all_issues = []

                for file_info in python_files:
                    filename = file_info['filename']
                    content = client.get_file_content(filename, pr_details['head']['sha'])
                    if not content:
                        continue

                    sec_issues = security_analyzer.analyze(content, filename)
                    smell_issues = smell_analyzer.analyze(content, filename)
                    comp_issues = complexity_analyzer.analyze(content, filename)
                    perf_issues = performance_analyzer.analyze(content, filename)

                    raw_file_issues = sec_issues.issues + smell_issues + comp_issues + perf_issues
                    file_issues = aggregator.merge_findings(raw_file_issues)

                    # Predict severity using ML
                    for issue in file_issues:
                        try:
                            ai_reviewer.enhance_issue_with_nlp(issue, content[:2000])
                            if "codebert" not in issue.source:
                                issue.source.append("codebert")
                        except Exception:
                            issue.explanation = issue.message
                            issue.fix_suggestion = issue.suggestion or "Review this issue and apply appropriate fixes."

                        try:
                            ml_issue = {
                                "type": issue.type.value,
                                "severity": issue.severity.value,
                                "line_number": issue.line_number,
                                "message": issue.message,
                                "rule_id": issue.rule_id or "",
                                "suggestion": issue.suggestion,
                                "code_snippet": issue.code_snippet,
                                "explanation": issue.explanation,
                            }
                            ml_result = ml_classifier.predict([ml_issue])[0]
                            if ml_classifier.is_trained:
                                issue.ml_severity = ml_result["ml_severity"]
                                issue.ml_confidence = ml_result["ml_confidence"]
                                issue.ml_model_version = ml_result.get("ml_model_version")
                                if "ml" not in issue.source:
                                    issue.source.append("ml")
                        except Exception:
                            pass

                    all_issues.extend(file_issues)

                    fa = FileAnalysis(
                        file_path=filename,
                        language="python",
                        lines_of_code=len(content.split('\n')),
                        issues=file_issues
                    )
                    all_file_analyses.append(fa)

                by_type = {}
                by_severity = {}
                for issue in all_issues:
                    by_type[issue.type.value] = by_type.get(issue.type.value, 0) + 1
                    by_severity[issue.severity.value] = by_severity.get(issue.severity.value, 0) + 1

                overall_risk = "none"
                if by_severity.get("critical", 0) > 0:
                    overall_risk = "critical"
                elif by_severity.get("high", 0) > 0:
                    overall_risk = "high"
                elif by_severity.get("medium", 0) > 0:
                    overall_risk = "medium"
                elif by_severity.get("low", 0) > 0:
                    overall_risk = "low"

                summary = AnalysisSummary(
                    total_issues=len(all_issues),
                    by_type=by_type,
                    by_severity=by_severity,
                    overall_risk=overall_risk,
                    file_path=repo_full_name
                )

                code_sample = f"PR: {repo_full_name} #{pr_number}\n{pr_details.get('title','')}\n{pr_details.get('body','')[:500]}\n\nDiff:\n"
                for file_info in python_files[:3]:
                    patch = files_by_name_bg.get(file_info['filename'], {}).get('patch')
                    content_source = patch if patch else ""
                    if not content_source:
                        try:
                            content_source = client.get_file_content(file_info['filename'], pr_details['head']['sha']) or ""
                        except Exception:
                            content_source = ""
                    if content_source:
                        truncated = content_source[:2500] + ("\n# ... truncated" if len(content_source) > 2500 else "")
                        code_sample += f"\n# {file_info['filename']}\n{truncated}\n"

                try:
                    ai_res_bg = ai_reviewer.review_code_structured(code_sample, repo_full_name, all_issues)
                    ai_review = ai_res_bg.get("summary") or ai_res_bg.get("raw") or "AI review unavailable; static analysis completed."
                    ai_available_bg = ai_res_bg.get("ai_available", False)
                    ai_error_bg = ai_res_bg.get("error")
                    ai_model_bg = ai_res_bg.get("model")
                    ai_structured_bg = {"issues": ai_res_bg.get("issues", []), "recommendations": ai_res_bg.get("recommendations", []), "raw": ai_res_bg.get("raw")}
                except Exception as e:
                    app.logger.error(f"AI review failed in webhook: {e}")
                    ai_review = "AI review unavailable; static analysis completed."
                    ai_available_bg = False
                    ai_error_bg = str(e)
                    ai_model_bg = getattr(ai_reviewer, "model", None)
                    ai_structured_bg = None

                response = ReviewResponse(
                    request_id=str(uuid.uuid4()),
                    file_analyses=all_file_analyses,
                    summary=summary,
                    ai_review=ai_review,
                    ai_available=ai_available_bg,
                    ai_error=ai_error_bg,
                    ai_model=ai_model_bg,
                    ai_structured=ai_structured_bg,
                    processing_time_ms=0
                )

                scan = ScanRecord(
                    user_id=uid,
                    request_id=response.request_id,
                    file_analyses=[MongoFileAnalysis.model_validate(fa.model_dump()) for fa in all_file_analyses],
                    summary=MongoAnalysisSummary.model_validate(summary.model_dump()),
                    ai_review=ai_review,
                    ai_available=ai_available_bg,
                    ai_error=ai_error_bg,
                    ai_model=ai_model_bg,
                    ai_structured=ai_structured_bg,
                    github_pr_url=f"https://github.com/{repo_full_name}/pull/{pr_number}",
                    github_pr_number=pr_number,
                    github_repo=repo_full_name,
                    processing_time_ms=response.processing_time_ms
                )
                scan_service.create_scan(scan)

                commenter = GitHubCommenter(client)
                comment_body = commenter.format_review_comment(response)
                client.create_pr_comment(pr_number, comment_body)
                app.logger.info(f"Webhook processing completed and comment posted for PR #{pr_number}")
            except Exception as e:
                app.logger.error(f"Background PR processing failed: {e}")

    app = current_app._get_current_object()
    thread = threading.Thread(target=process_pr_async, args=(app, repo_full_name, pr_number, github_token, user_id))
    thread.start()

    return jsonify({"message": "Processing started"}), 202

