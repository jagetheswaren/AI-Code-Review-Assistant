from flask import Blueprint, request, jsonify, current_app, g
import uuid
import time
from typing import Dict, Any, List
from functools import wraps

from analyzers.security_analyzer import SecurityAnalyzer
from analyzers.smell_analyzer import SmellAnalyzer
from analyzers.complexity_analyzer import ComplexityAnalyzer
from reviewer.ai_reviewer import AIReviewer
from reviewer.aggregator import FindingAggregator
from models.review import ReviewRequest, ReviewResponse, AnalysisSummary, FileAnalysis, Issue, IssueType, Severity
from models.mongodb_models import AnalysisSummary as MongoAnalysisSummary
from models.mongodb_models import FileAnalysis as MongoFileAnalysis
from models.mongodb_models import ScanRecord
from database.mongodb import scan_service
from services.github_client import GitHubClient, create_github_client
from reviewer.github_commenter import GitHubCommenter
from auth.jwt_auth import decode_token


review_bp = Blueprint('review', __name__)

security_analyzer = SecurityAnalyzer()
smell_analyzer = SmellAnalyzer()
complexity_analyzer = ComplexityAnalyzer()
ai_reviewer = AIReviewer()
aggregator = FindingAggregator()


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




@review_bp.route('/api/analyze', methods=['POST'])
@token_required
def analyze_code():
    start_time = time.time()
    
    user_id = g.current_user.get('user_id') if hasattr(g, 'current_user') else None
    
    data = request.get_json()

    if not data or 'code' not in data:
        return jsonify({"error": "Code is required"}), 400

    code = data['code']
    filename = data.get('filename', 'code.py')
    github_pr_url = data.get('github_pr_url')
    github_pr_number = data.get('github_pr_number')
    github_repo = data.get('github_repo')

    request_id = str(uuid.uuid4())

    security_issues = security_analyzer.analyze(code, filename)
    smell_issues = smell_analyzer.analyze(code, filename)
    complexity_issues = complexity_analyzer.analyze(code, filename)

    all_issues = security_issues.issues + smell_issues + complexity_issues

    # Enhance issues with NLP explanations
    for issue in all_issues:
        # Static findings already include actionable suggestions.  Keep the
        # request resilient when the optional NLP model is not installed.
        issue.explanation = issue.message
        issue.fix_suggestion = issue.suggestion

    ai_review = ai_reviewer.review_code(code, filename, all_issues)

    file_analysis = FileAnalysis(
        file_path=filename,
        language="python",
        lines_of_code=len(code.split('\n')),
        issues=all_issues
    )

    by_type = {}
    by_severity = {}
    for issue in all_issues:
        by_type[issue.type.value] = by_type.get(issue.type.value, 0) + 1
        by_severity[issue.severity.value] = by_severity.get(issue.severity.value, 0) + 1

    overall_risk = _calculate_overall_risk(by_severity)

    summary = AnalysisSummary(
        total_issues=len(all_issues),
        by_type=by_type,
        by_severity=by_severity,
        overall_risk=overall_risk,
        file_path=filename
    )

    response = ReviewResponse(
        request_id=request_id,
        file_analyses=[file_analysis],
        summary=summary,
        ai_review=ai_review,
        processing_time_ms=int((time.time() - start_time) * 1000)
    )

    # Save to database
    try:
        scan = ScanRecord(
            user_id=user_id,
            request_id=request_id,
            file_analyses=[MongoFileAnalysis.model_validate(file_analysis.model_dump())],
            summary=MongoAnalysisSummary.model_validate(summary.model_dump()),
            ai_review=ai_review,
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
@token_required
def analyze_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.py'):
        return jsonify({"error": "Only Python files (.py) are supported"}), 400

    code = file.read().decode('utf-8')
    filename = file.filename

    data = {'code': code, 'filename': filename}
    request.json = data
    return analyze_code()


@review_bp.route('/api/webhook/github', methods=['POST'])
def github_webhook():
    signature = request.headers.get('X-Hub-Signature-256', '')
    payload = request.get_data()

    webhook_secret = current_app.config.get('GITHUB_WEBHOOK_SECRET')
    if not webhook_secret:
        return jsonify({"error": "Webhook secret not configured"}), 503

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

    reviews = []
    for file_info in python_files:
        filename = file_info['filename']
        content = client.get_file_content(filename, head_sha)
        if not content:
            continue

        security_issues = security_analyzer.analyze(content, filename)
        smell_issues = smell_analyzer.analyze(content, filename)
        complexity_issues = complexity_analyzer.analyze(content, filename)

        all_issues = security_issues.issues + smell_issues + complexity_issues
        ai_review = ai_reviewer.review_code(content, filename, all_issues)

        file_analysis = FileAnalysis(
            file_path=filename,
            language="python",
            lines_of_code=len(content.split('\n')),
            issues=all_issues
        )

        by_type = {}
        by_severity = {}
        for issue in all_issues:
            by_type[issue.type.value] = by_type.get(issue.type.value, 0) + 1
            by_severity[issue.severity.value] = by_severity.get(issue.severity.value, 0) + 1

        overall_risk = _calculate_overall_risk(by_severity)

        summary = AnalysisSummary(
            total_issues=len(all_issues),
            by_type=by_type,
            by_severity=by_severity,
            overall_risk=overall_risk,
            file_path=filename
        )

        review = ReviewResponse(
            request_id=str(uuid.uuid4()),
            file_analyses=[file_analysis],
            summary=summary,
            ai_review=ai_review
        )
        reviews.append(review)

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
        
        scans = scan_service.get_user_scans(user_id, page=page, per_page=per_page)
        return jsonify({"scans": [_scan_summary(scan) for scan in scans]}), 200
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
