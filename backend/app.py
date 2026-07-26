from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database.mongodb import init_mongo


def create_app(*, mongo_client=None, database_name="code_review_assistant"):
    """Create the Flask application; tests may inject an in-memory Mongo client."""
    app = Flask(__name__)
    app.config.update(GITHUB_TOKEN=settings.github_token, GITHUB_WEBHOOK_SECRET=settings.github_webhook_secret,
                      JWT_SECRET=settings.jwt_secret)
    CORS(app, origins=settings.cors_origins.split(","))

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
        return jsonify({"status": "Healthy"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.flask_port, debug=settings.flask_env == "development")
