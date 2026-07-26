from flask import Blueprint, request, jsonify, g
from functools import wraps
from database.mongodb import settings_service
from auth.jwt_auth import decode_token

settings_bp = Blueprint('settings', __name__)


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


@settings_bp.route('/api/settings', methods=['GET'])
@token_required
def get_settings():
    user_id = g.current_user['user_id']
    settings = settings_service.get_settings(user_id)
    return jsonify({
        "theme": settings.theme,
        "notifications_enabled": settings.notifications_enabled,
        "email_notifications": settings.email_notifications,
        "auto_analyze_webhook": settings.auto_analyze_webhook,
        "default_language": settings.default_language,
        "analysis_depth": settings.analysis_depth
    })


@settings_bp.route('/api/settings', methods=['PUT'])
@token_required
def update_settings():
    user_id = g.current_user['user_id']
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    allowed_fields = {
        "theme", "notifications_enabled", "email_notifications",
        "auto_analyze_webhook", "default_language", "analysis_depth"
    }
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    settings = settings_service.update_settings(user_id, updates)
    return jsonify({
        "message": "Settings updated",
        "theme": settings.theme,
        "notifications_enabled": settings.notifications_enabled,
        "email_notifications": settings.email_notifications,
        "auto_analyze_webhook": settings.auto_analyze_webhook,
        "default_language": settings.default_language,
        "analysis_depth": settings.analysis_depth
    })
