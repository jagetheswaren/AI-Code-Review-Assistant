from flask import Blueprint, request, jsonify, g
import bcrypt
from datetime import datetime
from functools import wraps

from database.mongodb import user_service, scan_service
from auth.jwt_auth import create_access_token, decode_token
from models.mongodb_models import UserCreate, UserLogin


auth_bp = Blueprint('auth', __name__)


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


@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({"error": "username, email, and password are required"}), 400
    
    username = data['username'].strip()
    email = data['email'].strip().lower()
    password = data['password']
    
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if '@' not in email:
        return jsonify({"error": "Invalid email format"}), 400
    
    existing = user_service.get_user_by_email(email)
    if existing:
        return jsonify({"error": "Email already registered"}), 409
    
    existing = user_service.get_user_by_username(username)
    if existing:
        return jsonify({"error": "Username already taken"}), 409
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = user_service.create_user(username, email, password_hash)
    
    token = create_access_token(str(user.id), user.email, user.username)
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email
        }
    }), 201


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['email', 'password']):
        return jsonify({"error": "email and password are required"}), 400
    
    email = data['email'].strip().lower()
    password = data['password']
    
    user = user_service.get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401
    
    user_service.update_last_login(str(user.id))
    
    token = create_access_token(str(user.id), user.email, user.username)
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email
        }
    })


@auth_bp.route('/api/me', methods=['GET'])
@token_required
def get_current_user():
    user_id = g.current_user['user_id']
    user = user_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None
    })


@auth_bp.route('/api/refresh', methods=['POST'])
@token_required
def refresh_token():
    user_id = g.current_user['user_id']
    user = user_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    token = create_access_token(str(user.id), user.email, user.username)
    return jsonify({"token": token})


@auth_bp.route('/api/history', methods=['GET'])
@token_required
def get_history():
    user_id = g.current_user['user_id']
    limit = int(request.args.get('limit', 50))
    skip = int(request.args.get('skip', 0))
    
    scans = scan_service.get_user_scans(user_id, limit, skip)
    
    return jsonify({
        "scans": [
            {
                "id": str(scan.id),
                "request_id": scan.request_id,
                "timestamp": scan.timestamp.isoformat(),
                "filename": scan.summary.file_path,
                "total_issues": scan.summary.total_issues,
                "overall_risk": scan.summary.overall_risk,
                "by_type": scan.summary.by_type,
                "by_severity": scan.summary.by_severity
            }
            for scan in scans
        ]
    })


@auth_bp.route('/api/history/stats', methods=['GET'])
@token_required
def get_stats():
    user_id = g.current_user['user_id']
    stats = scan_service.get_user_scan_stats(user_id)
    return jsonify(stats)


@auth_bp.route('/api/history/trends', methods=['GET'])
@token_required
def get_trends():
    user_id = g.current_user['user_id']
    days = int(request.args.get('days', 30))
    
    trends = scan_service.get_issues_over_time(user_id, days)
    
    return jsonify({
        "trends": trends
    })


@auth_bp.route('/api/history/<scan_id>', methods=['GET'])
@token_required
def get_scan_detail(scan_id):
    user_id = g.current_user['user_id']
    scan = scan_service.get_scan_by_id(scan_id)
    
    if not scan:
        return jsonify({"error": "Scan not found"}), 404
    
    if str(scan.user_id) != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify({
        "id": str(scan.id),
        "request_id": scan.request_id,
        "timestamp": scan.timestamp.isoformat(),
        "file_analyses": [
            {
                "file_path": fa.file_path,
                "language": fa.language,
                "lines_of_code": fa.lines_of_code,
                "issues": [
                    {
                        "type": i.type.value if hasattr(i.type, 'value') else i.type,
                        "severity": i.severity.value if hasattr(i.severity, 'value') else i.severity,
                        "line_number": i.line_number,
                        "message": i.message,
                        "rule_id": i.rule_id,
                        "suggestion": i.suggestion,
                        "code_snippet": i.code_snippet,
                        "explanation": i.explanation,
                        "fix_suggestion": i.fix_suggestion
                    }
                    for i in fa.issues
                ]
            }
            for fa in scan.file_analyses
        ],
        "summary": {
            "total_issues": scan.summary.total_issues,
            "by_type": scan.summary.by_type,
            "by_severity": scan.summary.by_severity,
            "overall_risk": scan.summary.overall_risk,
            "file_path": scan.summary.file_path
        },
        "ai_review": scan.ai_review,
        "github_pr_url": scan.github_pr_url,
        "github_pr_number": scan.github_pr_number,
        "github_repo": scan.github_repo,
        "processing_time_ms": scan.processing_time_ms
    })