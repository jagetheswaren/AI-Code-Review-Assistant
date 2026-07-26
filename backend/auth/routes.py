from flask import Blueprint, request, jsonify
import bcrypt
from datetime import datetime

from database.mongodb import UserService, get_db
from auth.jwt_auth import create_access_token, require_auth
from models.review import UserCreate, UserLogin


auth_bp = Blueprint('auth', __name__)

user_service = UserService()


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
    
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    user = user_service.create_user(username, email, hashed_pw.decode('utf-8'))
    
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
@require_auth
def get_current_user():
    from flask import g
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
@require_auth
def refresh_token():
    from flask import g
    user_id = g.current_user['user_id']
    user = user_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    token = create_access_token(str(user.id), user.email, user.username)
    return jsonify({"token": token})