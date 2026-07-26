import bcrypt
from flask import Blueprint, request, jsonify, g
from functools import wraps
from database.mongodb import user_service, scan_service
from auth.jwt_auth import decode_token

profile_bp = Blueprint('profile', __name__)


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


@profile_bp.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    user_id = g.current_user['user_id']
    user = user_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "github_username": user.github_username,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None
    })


@profile_bp.route('/api/profile', methods=['PUT'])
@token_required
def update_profile():
    user_id = g.current_user['user_id']
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    allowed_fields = {"full_name", "username", "email"}
    updates = {k: v.strip() if isinstance(v, str) else v for k, v in data.items() if k in allowed_fields}

    if "email" in updates:
        if "@" not in updates["email"]:
            return jsonify({"error": "Invalid email format"}), 400
        updates["email"] = updates["email"].strip().lower()
        existing = user_service.get_user_by_email(updates["email"])
        if existing and str(existing.id) != user_id:
            return jsonify({"error": "Email already in use"}), 409

    if "username" in updates:
        if len(updates["username"]) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400
        existing = user_service.get_user_by_username(updates["username"])
        if existing and str(existing.id) != user_id:
            return jsonify({"error": "Username already taken"}), 409

    if updates:
        user_service.update_user(user_id, updates)

    user = user_service.get_user_by_id(user_id)
    return jsonify({
        "message": "Profile updated",
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
    })


@profile_bp.route('/api/profile/password', methods=['PUT'])
@token_required
def change_password():
    user_id = g.current_user['user_id']
    data = request.get_json()
    if not data or not all(k in data for k in ['current_password', 'new_password']):
        return jsonify({"error": "current_password and new_password are required"}), 400

    user = user_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Current password is incorrect"}), 401

    if len(data['new_password']) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    new_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_service.update_user(user_id, {"password_hash": new_hash})
    return jsonify({"message": "Password updated successfully"})


@profile_bp.route('/api/account', methods=['DELETE'])
@token_required
def delete_account():
    user_id = g.current_user['user_id']
    data = request.get_json()
    if not data or not data.get('confirm'):
        return jsonify({"error": "Send {\"confirm\": true} to delete your account"}), 400

    user_service.delete_user(user_id)
    return jsonify({"message": "Account deleted successfully"})
