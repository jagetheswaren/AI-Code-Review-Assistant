import logging
import os
from logging.config import dictConfig

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from config import settings
from database.mongodb import init_mongo


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
    app.config.update(GITHUB_TOKEN=settings.github_token, GITHUB_WEBHOOK_SECRET=settings.github_webhook_secret,
                      JWT_SECRET=settings.jwt_secret)
    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins}}, methods=["GET", "POST", "OPTIONS"], max_age=86_400)

    if mongo_client is not None:
        init_mongo(mongo_client=mongo_client, database_name=database_name)

    from api.review_routes import review_bp
    from api.auth_routes import auth_bp
    app.register_blueprint(review_bp)
    app.register_blueprint(auth_bp)

    @app.route("/")
    def home():
        return jsonify({"project": "AI Code Review Assistant", "status": "Running", "version": "1.0"})

    @app.route("/health")
    def health():
        return jsonify({"status": "healthy", "service": "code-review-assistant"})

    @app.route("/ready")
    def readiness():
        """Readiness probe that confirms MongoDB Atlas can be reached."""
        try:
            from database.mongodb import get_db
            get_db().command("ping")
        except Exception:
            app.logger.exception("Readiness probe failed")
            return jsonify({"status": "unavailable", "service": "code-review-assistant"}), 503
        return jsonify({"status": "ready", "service": "code-review-assistant"})

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        if app.config.get("TESTING"):
            raise error
        app.logger.exception("Unhandled request error: %s %s", request.method, request.path)
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.flask_port, debug=settings.flask_env == "development")
