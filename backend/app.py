from flask import Flask, jsonify
from flask_cors import CORS

from config import MAX_CONTENT_LENGTH, CORS_ALLOWED_ORIGINS
from database.db import init_db

from routes.scan_routes import scan_bp
from routes.history_routes import history_bp
from routes.stats_routes import stats_bp


def create_app():
    app = Flask(__name__)

    # Maximum request size
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # Allow frontend to communicate with backend
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": CORS_ALLOWED_ORIGINS
            }
        }
    )

    # Create database/table if needed
    init_db()

    # Register API routes
    app.register_blueprint(scan_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")
    app.register_blueprint(stats_bp, url_prefix="/api")

    @app.route("/")
    def home():
        return jsonify({
            "name": "ShieldX Backend",
            "status": "running"
        })

    @app.route("/api/health")
    def health():
        return jsonify({
            "success": True,
            "status": "healthy"
        })

    @app.errorhandler(413)
    def request_too_large(error):
        return jsonify({
            "success": False,
            "error": "Uploaded file is too large."
        }), 413

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Endpoint not found."
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "error": "Internal server error."
        }), 500

    return app


app = create_app()


if __name__ == "__main__":
    print("===================================")
    print("        ShieldX Backend")
    print("===================================")
    print("Server: http://127.0.0.1:5000")
    print("Health: http://127.0.0.1:5000/api/health")
    print("===================================")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )