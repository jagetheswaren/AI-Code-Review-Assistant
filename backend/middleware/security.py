import time
import re
from functools import wraps
from flask import request, jsonify, g

_rate_limits = {}


def rate_limit(max_requests=60, window=60):
    """Simple in-memory rate limiter: max_requests per window (seconds)."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            key = f"{f.__name__}:{request.remote_addr}"
            now = time.time()
            if key not in _rate_limits:
                _rate_limits[key] = []
            _rate_limits[key] = [t for t in _rate_limits[key] if now - t < window]
            if len(_rate_limits[key]) >= max_requests:
                return jsonify({"error": "Rate limit exceeded. Try again later."}), 429
            _rate_limits[key].append(now)
            return f(*args, **kwargs)
        return decorated
    return decorator


def sanitize_input(data):
    """Recursively strip potentially dangerous content from input."""
    if isinstance(data, str):
        data = data.strip()
        data = re.sub(r'<script[^>]*>.*?</script>', '', data, flags=re.IGNORECASE | re.DOTALL)
        data = re.sub(r'on\w+\s*=', '', data, flags=re.IGNORECASE)
        return data
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data


def security_headers(f):
    """Add security headers to all API responses."""
    @wraps(f)
    def decorated(*args, **kwargs):
        response = f(*args, **kwargs)
        if hasattr(response, 'headers'):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
    return decorated


def request_timer(f):
    """Attach request processing time to response."""
    @wraps(f)
    def decorated(*args, **kwargs):
        start = time.time()
        response = f(*args, **kwargs)
        elapsed = time.time() - start
        if hasattr(response, 'headers'):
            response.headers['X-Process-Time'] = f"{elapsed:.4f}"
        return response
    return decorated


def init_middleware(app):
    """Register middleware hooks on the Flask app."""
    app.before_request(lambda: setattr(g, '_request_start', time.time()))

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        if hasattr(g, '_request_start'):
            elapsed = time.time() - g._request_start
            response.headers['X-Process-Time'] = f"{elapsed:.4f}"
        return response
