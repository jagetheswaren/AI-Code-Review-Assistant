from flask import Blueprint, request, jsonify, current_app
import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta
from functools import wraps
from database.mongodb import user_service, scan_service
from models.review import UserCreate, UserLogin, TokenResponse


auth_bp = Blueprint('auth', __name__)


def get_jwt_secret():
    return current_app.config.get('JWT_SECRET', 'dev-secret-change-in-production')


def generate_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm='HS256')


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header missing or invalid'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            payload = decode_token(token)
            request.user_id = payload['user_id']
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated


@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    existing = user_service.get_user_by_email(email)
    if existing:
        return jsonify({'error': 'Email already registered'}), 409
    
    existing = user_service.get_user_by_username(username)
    if existing:
        return jsonify({'error': 'Username already taken'}), 409
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = user_service.create_user(username, email, password_hash)
    
    token = generate_token(str(user.id))
    
    return jsonify({
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
    }), 201


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = user_service.get_user_by_email(email)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    user_service.update_last_login(str(user.id))
    
    token = generate_token(str(user.id))
    
    return jsonify({
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
    })


@auth_bp.route('/api/me', methods=['GET'])
@token_required
def get_current_user():
    user = user_service.get_user_by_id(request.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': str(user.id),
        'username': user.username,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login': user.last_login.isoformat() if user.last_login else None
    })


@auth_bp.route('/api/history', methods=['GET'])
@token_required
def get_history():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)
    skip = (page - 1) * per_page
    
    scans = scan_service.get_user_scans(request.user_id, limit=per_page, skip=skip)
    
    return jsonify({
        'scans': [
            {
                'id': str(scan.id),
                'request_id': scan.request_id,
                'timestamp': scan.timestamp.isoformat() if scan.timestamp else None,
                'file_path': scan.summary.file_path,
                'total_issues': scan.summary.total_issues,
                'overall_risk': scan.summary.overall_risk,
                'by_type': scan.summary.by_type,
                'by_severity': scan.summary.by_severity,
                'github_pr_url': scan.github_pr_url
            }
            for scan in scans
        ],
        'page': page,
        'per_page': per_page
    })


@auth_bp.route('/api/history/<scan_id>', methods=['GET'])
@token_required
def get_scan_detail(scan_id):
    scan = scan_service.get_scan_by_id(scan_id)
    if not scan:
        return jsonify({'error': 'Scan not found'}), 404
    
    if str(scan.user_id) != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({
        'id': str(scan.id),
        'request_id': scan.request_id,
        'timestamp': scan.timestamp.isoformat() if scan.timestamp else None,
        'file_analyses': [
            {
                'file_path': fa.file_path,
                'language': fa.language,
                'lines_of_code': fa.lines_of_code,
                'issues': [
                    {
                        'type': issue.type.value,
                        'severity': issue.severity.value,
                        'line_number': issue.line_number,
                        'column': issue.column,
                        'message': issue.message,
                        'rule_id': issue.rule_id,
                        'suggestion': issue.suggestion,
                        'code_snippet': issue.code_snippet,
                        'explanation': issue.explanation,
                        'fix_suggestion': issue.fix_suggestion,
                        'ml_severity': issue.ml_severity,
                        'ml_confidence': issue.ml_confidence
                    }
                    for issue in fa.issues
                ]
            }
            for fa in scan.file_analyses
        ],
        'summary': {
            'total_issues': scan.summary.total_issues,
            'by_type': scan.summary.by_type,
            'by_severity': scan.summary.by_severity,
            'overall_risk': scan.summary.overall_risk,
            'file_path': scan.summary.file_path
        },
        'ai_review': scan.ai_review,
        'github_pr_url': scan.github_pr_url,
        'github_comment_url': scan.github_comment_url,
        'processing_time_ms': scan.processing_time_ms
    })


@auth_bp.route('/api/stats', methods=['GET'])
@token_required
def get_stats():
    stats = scan_service.get_user_scan_stats(request.user_id)
    return jsonify(stats)


@auth_bp.route('/api/trends', methods=['GET'])
@token_required
def get_trends():
    days = request.args.get('days', 30, type=int)
    days = min(max(days, 1), 365)
    
    trends = scan_service.get_issues_over_time(request.user_id, days)
    
    return jsonify({
        'trends': trends,
        'days': days
    })