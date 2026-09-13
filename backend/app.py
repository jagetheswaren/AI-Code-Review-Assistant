import logging
import os
from logging.config import dictConfig

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from config import settings
from database.mongodb import init_mongo
from middleware.security import init_middleware


def create_app(*, mongo_client=None, database_name="code_review_assistant"):
    """Create the Flask application; tests may inject an in-memory Mongo client."""
    if mongo_client is None:
        settings.validate_production_settings()

    dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {"default": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"}},
        "handlers": {"default": {"class": "logging.StreamHandler", "formatter": "default"}},
        "root": {"level": settings.log_level.upper(), "handlers": ["default"]},
    })
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    app.secret_key = settings.jwt_secret
    app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2 MB upload limit

    app.config.update(
        GITHUB_TOKEN=settings.github_token,
        GITHUB_WEBHOOK_SECRET=settings.github_webhook_secret,
        JWT_SECRET=settings.jwt_secret,
        GITHUB_CLIENT_ID=settings.github_client_id,
        GITHUB_CLIENT_SECRET=settings.github_client_secret,
        GITHUB_OAUTH_CALLBACK_URL=settings.github_oauth_callback_url,
        FRONTEND_URL=settings.cors_origins.split(",")[0].strip() if settings.cors_origins else "http://localhost:3000",
        OLLAMA_BASE_URL=settings.ollama_base_url,
        OLLAMA_MODEL=settings.ollama_model,
    )

    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], max_age=86_400,
         allow_headers=["Authorization", "Content-Type"], supports_credentials=True)

    init_middleware(app)

    if mongo_client is not None:
        init_mongo(mongo_client=mongo_client, database_name=database_name)

    from api.review_routes import review_bp
    from api.auth_routes import auth_bp
    from api.github_routes import github_bp
    from api.notification_routes import notification_bp
    from api.settings_routes import settings_bp
    from api.profile_routes import profile_bp
    from api.export_routes import export_bp

    app.register_blueprint(review_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(github_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(export_bp)

    @app.route("/")
    def home():
        return jsonify({"project": "IntelliReview AI", "status": "Running", "version": "2.0"})

    @app.route("/health")
    def health():
        return jsonify({"status": "healthy", "service": "intellireview-ai"})

    @app.route("/ready")
    def readiness():
        """Readiness probe that confirms MongoDB can be reached."""
        try:
            from database.mongodb import get_db
            get_db().command("ping")
        except Exception:
            app.logger.exception("Readiness probe failed")
            return jsonify({"status": "unavailable", "service": "intellireview-ai"}), 503
        return jsonify({"status": "ready", "service": "intellireview-ai"})

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        from werkzeug.exceptions import HTTPException
        if isinstance(error, HTTPException):
            return error
        if app.config.get("TESTING"):
            raise error
        app.logger.exception("Unhandled request error: %s %s", request.method, request.path)
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.flask_port, debug=settings.flask_env == "development")
