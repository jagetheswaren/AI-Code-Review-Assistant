from flask import Blueprint, request, jsonify, g
from functools import wraps
from database.mongodb import notification_service, Notification
from auth.jwt_auth import decode_token
from bson import ObjectId

notification_bp = Blueprint('notifications', __name__)


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


@notification_bp.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications():
    user_id = g.current_user['user_id']
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = request.args.get('limit', 50, type=int)

    notifications = notification_service.get_user_notifications(user_id, limit=limit, unread_only=unread_only)
    unread_count = notification_service.get_unread_count(user_id)

    return jsonify({
        "notifications": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "read": n.read,
                "link": n.link,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ],
        "unread_count": unread_count
    })


@notification_bp.route('/api/notifications/<notification_id>/read', methods=['PUT'])
@token_required
def mark_read(notification_id):
    user_id = g.current_user['user_id']
    success = notification_service.mark_read(user_id, notification_id)
    if not success:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification marked as read"})


@notification_bp.route('/api/notifications/read-all', methods=['PUT'])
@token_required
def mark_all_read():
    user_id = g.current_user['user_id']
    count = notification_service.mark_all_read(user_id)
    return jsonify({"message": f"Marked {count} notifications as read"})


@notification_bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    user_id = g.current_user['user_id']
    success = notification_service.delete_notification(user_id, notification_id)
    if not success:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification deleted"})


@notification_bp.route('/api/notifications', methods=['DELETE'])
@token_required
def delete_all_notifications():
    user_id = g.current_user['user_id']
    count = notification_service.delete_all(user_id)
    return jsonify({"message": f"Deleted {count} notifications"})
