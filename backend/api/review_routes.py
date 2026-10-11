from flask import Blueprint, request, jsonify, current_app, g
import uuid
import time
from typing import Dict, Any, List
from functools import wraps

from models.review import ReviewRequest, ReviewResponse, AnalysisSummary, FileAnalysis, Issue, IssueType, Severity
from models.mongodb_models import AnalysisSummary as MongoAnalysisSummary
from models.mongodb_models import FileAnalysis as MongoFileAnalysis
from models.mongodb_models import ScanRecord
from database.mongodb import scan_service
from services.github_client import GitHubClient, create_github_client
from reviewer.github_commenter import GitHubCommenter
from auth.jwt_auth import decode_token
from config import settings
from services.analysis_service import analysis_service
from middleware.security import rate_limit

review_bp = Blueprint('review', __name__)


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


def optional_token(f):
    """Allows unauthenticated instant code reviews while setting g.current_user if token is present."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = decode_token(token)
            if payload:
                g.current_user = payload
        return f(*args, **kwargs)
    return decorated


@review_bp.route('/api/analyze', methods=['POST'])
@rate_limit(max_requests=30, window=60)
@optional_token
def analyze_code():
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({"error": "Code is required"}), 400
    code = data['code']
    if not isinstance(code, str) or not code.strip():
        return jsonify({"error": "Code is required and must be non-empty"}), 400
    if len(code) > 500_000:
        return jsonify({"error": "Code too large (max 500KB)"}), 413
    filename = data.get('filename', 'code.py')
    github_pr_url = data.get('github_pr_url')
    github_pr_number = data.get('github_pr_number')
    github_repo = data.get('github_repo')
    return _perform_analysis(code, filename, github_pr_url, github_pr_number, github_repo)


def _perform_analysis(code: str, filename: str, github_pr_url=None, github_pr_number=None, github_repo=None):
    """Shared analysis logic used by both /api/analyze and /api/analyze/file."""
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None

    file_contents = [{"filename": filename, "content": code}]
    response = analysis_service.analyze_files(file_contents)

    try:
        scan = ScanRecord(
            user_id=user_id,
            request_id=response.request_id,
            file_analyses=[MongoFileAnalysis.model_validate(fa.model_dump()) for fa in response.file_analyses],
            summary=MongoAnalysisSummary.model_validate(response.summary.model_dump()),
            ai_review=response.ai_review,
            ai_available=response.ai_available,
            ai_error=response.ai_error,
            ai_model=response.ai_model,
            ai_structured=response.ai_structured,
            github_pr_url=github_pr_url,
            github_pr_number=github_pr_number,
            github_repo=github_repo,
            processing_time_ms=response.processing_time_ms
        )
        scan_service.create_scan(scan)
    except Exception as e:
        current_app.logger.error(f"Failed to save scan: {e}")

    if github_pr_url and github_pr_number and github_repo:
        _post_github_comment(github_repo, github_pr_number, response)

    return jsonify(response.model_dump())


@review_bp.route('/api/analyze/file', methods=['POST'])
@rate_limit(max_requests=30, window=60)
@optional_token
def analyze_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.py'):
        return jsonify({"error": "Only Python files (.py) are supported"}), 400

    try:
        raw = file.read()
        if len(raw) > 1_000_000:
            return jsonify({"error": "File too large (max 1MB)"}), 413
        code = raw.decode('utf-8')
    except Exception:
        return jsonify({"error": "Failed to decode file as UTF-8"}), 400
    filename = file.filename

    return _perform_analysis(code, filename)


@review_bp.route('/api/webhook/github', methods=['POST'])
@rate_limit(max_requests=60, window=60)
def github_webhook():
    # Deprecated alias — canonical is /api/github/webhook (github_routes). Kept for backward compatibility.
    current_app.logger.warning("Deprecated webhook path /api/webhook/github used — prefer /api/github/webhook")
    signature = request.headers.get('X-Hub-Signature-256', '')
    payload = request.get_data()

    webhook_secret = current_app.config.get('GITHUB_WEBHOOK_SECRET')
    if not webhook_secret:
        return jsonify({"error": "Webhook secret not configured"}), 400

    if not _verify_signature(payload, signature, webhook_secret):
        return jsonify({"error": "Invalid signature"}), 401

    event = request.headers.get('X-GitHub-Event', '')
    if event != 'pull_request':
        return jsonify({"message": "Event not handled"}), 200

    data = request.get_json()
    action = data.get('action')

    if action not in ('opened', 'synchronize', 'reopened'):
        return jsonify({"message": "Action not handled"}), 200

    pr = data['pull_request']
    pr_number = pr['number']
    repo_full_name = data['repository']['full_name']
    head_sha = pr['head']['sha']

    github_token = current_app.config.get('GITHUB_TOKEN')
    if not github_token:
        return jsonify({"error": "GitHub token not configured"}), 500

    client = create_github_client(github_token, repo_full_name)
    files = client.get_pull_request_files(pr_number)

    python_files = [f for f in files if f['filename'].endswith('.py')]
    if not python_files:
        return jsonify({"message": "No Python files in PR"}), 200

    file_contents = []
    for file_info in python_files:
        filename = file_info['filename']
        content = client.get_file_content(filename, head_sha)
        if content:
            file_contents.append({"filename": filename, "content": content})

    if not file_contents:
        return jsonify({"message": "No valid Python files to review"}), 200

    response = analysis_service.analyze_files(file_contents)
    reviews = [response]  # Keep it as a list for compatibility if needed

    commenter = GitHubCommenter(client)
    summary_comment = commenter.format_pr_summary_comment(reviews)
    client.create_pr_comment(pr_number, summary_comment)

    for review in reviews:
        for file_analysis in review.file_analyses:
            for issue in file_analysis.issues:
                if issue.severity in (Severity.CRITICAL, Severity.HIGH):
                    comment_body = commenter.format_review_comment(review)
                    client.create_review_comment(
                        pr_number=pr_number,
                        commit_sha=head_sha,
                        path=file_analysis.file_path,
                        body=comment_body,
                        line=issue.line_number
                    )
                    break

    return jsonify({"message": "Review completed", "files_reviewed": len(reviews)}), 200


def _calculate_overall_risk(by_severity: Dict[str, int]) -> str:
    if by_severity.get('critical', 0) > 0:
        return 'critical'
    elif by_severity.get('high', 0) > 0:
        return 'high'
    elif by_severity.get('medium', 0) > 2:
        return 'high'
    elif by_severity.get('medium', 0) > 0:
        return 'medium'
    elif by_severity.get('low', 0) > 0:
        return 'low'
    return 'none'


def _verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    import hmac
    import hashlib
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


def _post_github_comment(repo: str, pr_number: int, review: ReviewResponse):
    github_token = current_app.config.get('GITHUB_TOKEN')
    if not github_token:
        return

    try:
        client = create_github_client(github_token, repo)
        commenter = GitHubCommenter(client)
        comment_body = commenter.format_review_comment(review)
        client.create_pr_comment(pr_number, comment_body)
    except Exception as e:
        current_app.logger.error(f"Failed to post GitHub comment: {e}")


@review_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "code-review-assistant"}), 200


@review_bp.route('/api/ai/health', methods=['GET'])
def ai_health():
    """Proxy to Ollama /api/tags to verify AI availability without exposing internal URL."""
    try:
        import requests
        base = current_app.config.get('OLLAMA_BASE_URL') or settings.ollama_base_url
        # Ensure config exposes ollama info even if not in app.config
        if not base:
            base = settings.ollama_base_url
        url = base.rstrip("/") + "/api/tags"
        resp = requests.get(url, timeout=5)
        if resp.status_code != 200:
            return jsonify({"ai_available": False, "reachable": False, "error": f"HTTP {resp.status_code}", "model": settings.ollama_model, "base_url": base}), 200
        data = resp.json()
        models = [m.get("name") for m in data.get("models", [])]
        model_found = settings.ollama_model in models or any(settings.ollama_model.split(":")[0] in m for m in models)
        return jsonify({
            "ai_available": model_found,
            "reachable": True,
            "models": models,
            "expected_model": settings.ollama_model,
            "base_url": base,
            "error": None if model_found else f"Model '{settings.ollama_model}' not found",
        }), 200
    except Exception as e:
        base = current_app.config.get('OLLAMA_BASE_URL') or settings.ollama_base_url
        return jsonify({"ai_available": False, "reachable": False, "error": str(e), "model": settings.ollama_model, "base_url": base}), 200


@review_bp.route('/api/ai/status', methods=['GET'])
def ai_status():
    """Safe provider status with an explicit static-analysis fallback."""
    reviewer = analysis_service.ai_reviewer
    health = reviewer.check_health()
    provider = health.get("provider", "none")
    available = bool(health["reachable"] and provider in ("groq", "ollama"))
    ollama_status = health.get("ollama_status", "not_checked")
    if available:
        message = None
        next_command = None
        fallback = "ollama" if provider == "groq" and ollama_status == "available" else "static"
    elif ollama_status == "model_missing":
        message = f"Ollama is running, but {reviewer.ollama_model} is not installed."
        next_command = f"ollama pull {reviewer.ollama_model}"
        fallback = "static"
    elif reviewer.groq_client and health.get("groq_status") != "available":
        message = f"{health.get('groq_error') or 'Groq is unavailable.'} Ollama is not available; static analysis is still available."
        next_command = f"ollama serve && ollama pull {reviewer.ollama_model}"
        fallback = "static"
    else:
        message = f"Ollama is not running at {reviewer.base_url}. Static analysis is still available."
        next_command = f"ollama serve && ollama pull {reviewer.ollama_model}"
        fallback = "static"

    ml_info = analysis_service.ml_classifier.get_model_info() if analysis_service.ml_classifier else None
    return jsonify({
        "available": available,
        "provider": provider if available else "none",
        "model": health.get("model") if available else None,
        "fallback": fallback,
        "static_analysis": True,
        "message": message,
        "next_command": next_command,
        "groq_status": health.get("groq_status", "not_configured"),
        "ollama_status": ollama_status,
        "expected_model": reviewer.ollama_model,
        "ai_available": available,
        "reachable": health["reachable"],
        "models": health["models"],
        "base_url": reviewer.base_url,
        "error": health.get("error") if not available else None,
        "ollama_error": health.get("ollama_error") if ollama_status != "available" else None,
        "ml_model_info": ml_info
    }), 200


@review_bp.route('/api/admin/model/reload', methods=['POST'])
@token_required
def reload_ml_model():
    """Admin route to reload the ML severity classifier model from disk."""
    try:
        success = analysis_service.ml_classifier.load()
        if success:
            info = analysis_service.ml_classifier.get_model_info()
            return jsonify({"message": "Model reloaded successfully", "info": info}), 200
        else:
            return jsonify({"error": "Failed to reload model, check logs"}), 500
    except Exception as e:
        current_app.logger.error(f"Failed to reload ML model: {e}")
        return jsonify({"error": str(e)}), 500


@review_bp.route('/api/statistics', methods=['GET'])
@review_bp.route('/api/stats', methods=['GET'])
@token_required
def get_statistics():
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    try:
        stats = scan_service.get_user_statistics(user_id)
        return jsonify(stats), 200
    except Exception as e:
        current_app.logger.error(f"Failed to get statistics: {e}")
        return jsonify({"error": "Failed to get statistics"}), 500


@review_bp.route('/api/history', methods=['GET'])
@token_required
def get_history():
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = max(1, min(per_page, 100))
        scans = scan_service.get_user_scans(user_id, page=page, per_page=per_page)
        total = scan_service.count_user_scans(user_id)
        total_pages = max(1, (total + per_page - 1) // per_page)
        return jsonify({
            "scans": [_scan_summary(scan) for scan in scans],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }), 200
    except Exception as e:
        current_app.logger.error(f"Failed to get history: {e}")
        return jsonify({"error": "Failed to get history"}), 500


@review_bp.route('/api/trends', methods=['GET'])
@token_required
def get_trends():
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    days = request.args.get('days', 30, type=int)
    return jsonify({"trends": scan_service.get_issues_over_time(user_id, max(1, min(days, 365)))}), 200


@review_bp.route('/api/history/<scan_id>', methods=['GET'])
@token_required
def get_scan_detail(scan_id):
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    scan = scan_service.get_scan_by_id(scan_id)
    if not scan or str(scan.user_id) != user_id:
        return jsonify({"error": "Report not found"}), 404
    return jsonify(scan.model_dump(by_alias=True, mode="json")), 200


@review_bp.route('/api/report/<request_id>', methods=['GET'])
@token_required
def get_report(request_id):
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    try:
        scan = scan_service.get_scan_by_request_id(request_id)
        if not scan or str(scan.user_id) != user_id:
            return jsonify({"error": "Report not found"}), 404
        
        return jsonify(scan.model_dump(by_alias=True, mode="json")), 200
    except Exception as e:
        current_app.logger.error(f"Failed to get report: {e}")
        return jsonify({"error": "Failed to get report"}), 500


@review_bp.route('/api/scan/<request_id>/claim', methods=['POST'])
@token_required
def claim_scan(request_id):
    """Allows an authenticated user to claim an unauthenticated or guest scan into their personal history."""
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    scan = scan_service.get_scan_by_request_id(request_id)
    if not scan:
        return jsonify({"error": "Scan not found"}), 404

    if scan.user_id:
        if str(scan.user_id) == user_id:
            return jsonify({"message": "Scan already linked to your account", "scan_id": str(scan.id)}), 200
        return jsonify({"error": "Scan is already owned by another account"}), 403

    claimed = scan_service.claim_scan(request_id, user_id)
    if claimed:
        updated = scan_service.get_scan_by_request_id(request_id)
        return jsonify({"message": "Scan saved to your history", "scan_id": str(updated.id) if updated else None}), 200
    return jsonify({"error": "Failed to claim scan"}), 500


@review_bp.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    try:
        stats = scan_service.get_user_statistics(user_id)
        recent_scans = scan_service.get_user_scans(user_id, page=1, per_page=10)
        
        dashboard = {
            "statistics": stats,
            "recent_scans": [s.model_dump(by_alias=True, mode="json") for s in recent_scans],
            "timestamp": str(time.time())
        }
        return jsonify(dashboard), 200
    except Exception as e:
        current_app.logger.error(f"Failed to get dashboard: {e}")
        return jsonify({"error": "Failed to get dashboard"}), 500


def _scan_summary(scan):
    """Match the compact scan representation consumed by the History page."""
    return {
        "id": str(scan.id),
        "request_id": scan.request_id,
        "timestamp": scan.timestamp.isoformat(),
        "file_path": scan.summary.file_path,
        "total_issues": scan.summary.total_issues,
        "overall_risk": scan.summary.overall_risk,
        "by_type": scan.summary.by_type,
        "by_severity": scan.summary.by_severity,
    }
