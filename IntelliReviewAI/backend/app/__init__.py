from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging

from app.config import config
from app.database import get_db, close_db

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Extensions
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    jwt = JWTManager(app)
    
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[app.config['RATELIMIT_DEFAULT']],
        storage_uri=app.config['RATELIMIT_STORAGE_URL']
    )
    
    # Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.github import github_bp
    from app.routes.analysis import analysis_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(github_bp, url_prefix='/api/github')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    
    # Webhook (no prefix)
    from app.routes.webhook import webhook_bp
    app.register_blueprint(webhook_bp)
    
    # DB teardown
    @app.teardown_appcontext
    def teardown_db(exception):
        close_db()
    
    # Health check
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'IntelliReview AI'}
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return {'error': 'Rate limit exceeded'}, 429
    
    return app