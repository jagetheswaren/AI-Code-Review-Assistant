import secrets
from flask import Blueprint, request, jsonify, redirect, current_app, g
import requests as http_requests
from functools import wraps
from database.mongodb import user_service, repo_service, pr_service
from auth.jwt_auth import create_access_token, decode_token

github_bp = Blueprint('github', __name__)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        token = auth_header.split(' ')[1]
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
        headers={"Accept": "application/json"}
    )

    if token_response.status_code != 200:
        return jsonify({"error": "Failed to exchange OAuth code"}), 500

    token_data = token_response.json()
    access_token = token_data.get('access_token')
    if not access_token:
        return jsonify({"error": "No access token received"}), 500

    gh_client_response = http_requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}", "Accept": "application/vnd.github.v3+json"}
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
            headers={"Authorization": f"token {pat_token}", "Accept": "application/vnd.github.v3+json"}
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


@github_bp.route('/api/github/repos/<repo_full_name>/branches', methods=['GET'])
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


@github_bp.route('/api/github/repos/<repo_full_name>/pull-requests', methods=['GET'])
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
            "head_sha": pr.get("head", {}).get("sha", ""),
            "head_branch": pr.get("head", {}).get("ref", ""),
            "base_branch": pr.get("base", {}).get("ref", "main"),
            "state": pr.get("state", "open"),
            "changed_files": pr.get("changed_files", 0),
            "additions": pr.get("additions", 0),
            "deletions": pr.get("deletions", 0),
            "created_at": pr.get("created_at"),
            "updated_at": pr.get("updated_at"),
        } for pr in prs]})
    except Exception as e:
        current_app.logger.error(f"Failed to fetch PRs: {e}")
        return jsonify({"error": "Failed to fetch pull requests"}), 500


@github_bp.route('/api/github/repos/<repo_full_name>/pull-requests/<int:pr_number>/analyze', methods=['POST'])
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
        from reviewer.ai_reviewer import AIReviewer
        from models.review import ReviewResponse, FileAnalysis, AnalysisSummary, Issue
        import uuid
        import time

        owner, name = repo_full_name.split("/", 1)
        client = GitHubClient(user.github_token, owner, name)

        pr_details = client.get_pr_details(pr_number)
        files = client.get_pull_request_files(pr_number)
        python_files = [f for f in files if f['filename'].endswith('.py')]

        if not python_files:
            return jsonify({"message": "No Python files in this PR", "files_reviewed": 0})

        security_analyzer = SecurityAnalyzer()
        smell_analyzer = SmellAnalyzer()
        complexity_analyzer = ComplexityAnalyzer()
        ai_reviewer = AIReviewer()

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

            file_issues = sec_issues.issues + smell_issues + comp_issues
            all_issues.extend(file_issues)

            for issue in file_issues:
                issue.explanation = issue.message
                issue.fix_suggestion = issue.suggestion

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

        code_sample = ""
        for file_info in python_files[:3]:
            content = client.get_file_content(file_info['filename'], pr_details['head']['sha'])
            if content:
                code_sample += f"\n# {file_info['filename']}\n{content[:500]}\n"

        ai_review = ai_reviewer.review_code(code_sample, repo_full_name, all_issues)

        response = ReviewResponse(
            request_id=str(uuid.uuid4()),
            file_analyses=all_file_analyses,
            summary=summary,
            ai_review=ai_review,
            processing_time_ms=0
        )

        from database.mongodb import scan_service, ScanRecord, FileAnalysis as MongoFileAnalysis, AnalysisSummary as MongoAnalysisSummary
        scan = ScanRecord(
            user_id=user.id,
            request_id=response.request_id,
            file_analyses=[MongoFileAnalysis.model_validate(fa.model_dump()) for fa in all_file_analyses],
            summary=MongoAnalysisSummary.model_validate(summary.model_dump()),
            ai_review=ai_review,
            github_pr_url=f"https://github.com/{repo_full_name}/pull/{pr_number}",
            github_pr_number=pr_number,
            github_repo=repo_full_name,
            processing_time_ms=response.processing_time_ms
        )
        scan_service.create_scan(scan)

        return jsonify({
            "message": "Analysis completed",
            "request_id": response.request_id,
            "files_reviewed": len(all_file_analyses),
            "total_issues": len(all_issues),
            "overall_risk": overall_risk,
            "summary": summary.model_dump(),
            "ai_review": ai_review
        })

    except Exception as e:
        current_app.logger.error(f"Failed to analyze PR: {e}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
