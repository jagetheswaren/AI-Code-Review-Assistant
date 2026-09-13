from flask import Blueprint, request, jsonify, g
import bcrypt
from datetime import datetime
from functools import wraps

from database.mongodb import user_service, scan_service
from auth.jwt_auth import create_access_token, decode_token
from models.mongodb_models import UserCreate, UserLogin
from middleware.security import rate_limit


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
@rate_limit(max_requests=20, window=60)
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
@rate_limit(max_requests=30, window=60)
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