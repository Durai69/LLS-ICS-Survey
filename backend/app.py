# backend/app.py
# This version updates the authentication from JWT to PASETO.

from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file

from flask import Flask, request, jsonify, make_response, current_app, g
from flask_cors import CORS
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import os
import secrets
import logging
from functools import wraps
import json

# Import PASETO library
from pyseto import Paseto
from pyseto import Key

# Configure logging to show info messages
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import custom modules
from backend.security import verify_password, get_frontend_role, hash_password
from backend.database import SessionLocal, engine, Base
from backend.models import User, Department

# Import blueprints for modular routing
from backend.routes.user_routes import user_bp
from backend.routes.permission_routes import permission_bp
from backend.routes.survey_routes import survey_bp
from backend.routes.department_routes import department_bp # Assuming department_bp exists

# Import PASETO utilities
from backend.utils.paseto_utils import PASETO_KEY, paseto, paseto_required

app = Flask(__name__)

# --- Flask Configuration ---
app.secret_key = os.getenv("FLASK_SECRET_KEY", "another_super_secret_key_for_flask_CHANGE_THIS")

# --- PASETO Configuration ---
# PASETO V2 Local requires a 32-byte (256-bit) symmetric key.
# It's crucial to generate a strong, random key and store it securely (e.g., in .env).
# For development, you can generate one with: secrets.token_bytes(32).hex()
PASETO_SECRET_KEY_HEX = os.getenv("PASETO_SECRET_KEY", secrets.token_bytes(32).hex())
if len(PASETO_SECRET_KEY_HEX) != 64: # 32 bytes = 64 hex characters
    raise ValueError("PASETO_SECRET_KEY must be a 64-character hex string (32 bytes).")

PASETO_KEY = Key.new(version=2, purpose="local", key=bytes.fromhex(PASETO_SECRET_KEY_HEX))
PASETO_TOKEN_EXPIRES = timedelta(hours=1) # Token expires after 1 hour

# Cookie settings for PASETO token
PASETO_COOKIE_NAME = 'paseto_token_cookie'
PASETO_COOKIE_SECURE = False # Set to True in production for HTTPS
PASETO_COOKIE_HTTPONLY = True # Keep True for security (JS cannot access)

PASETO_COOKIE_PATH = '/'
PASETO_COOKIE_SAMESITE = "Lax"

# Debugging PASETO config
print(f"DEBUG: PASETO_SECRET_KEY is set to: {'***KEY_IS_SET***' if PASETO_SECRET_KEY_HEX else '!!!KEY_IS_NOT_SET!!!'}")
print(f"DEBUG: PASETO_COOKIE_NAME is: {PASETO_COOKIE_NAME}")

print(f"DEBUG: PASETO_COOKIE_PATH is: {PASETO_COOKIE_PATH}")
print(f"DEBUG: PASETO_COOKIE_SAMESITE is: {PASETO_COOKIE_SAMESITE}")

# --- CORS Configuration ---
CORS(app, supports_credentials=True, origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:5173"])

# Helper function to get a database session for a request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Custom PASETO Authentication Decorator ---
# This replaces @jwt_required() from Flask-JWT-Extended
def paseto_required(optional=False):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            paseto_token = request.cookies.get(PASETO_COOKIE_NAME)
            if not paseto_token:
                if optional:
                    g.current_user_identity = None
                    return fn(*args, **kwargs)
                return jsonify({"msg": f"Missing cookie \"{PASETO_COOKIE_NAME}\""}), 401
            try:
                paseto = Paseto.new(2, "local")
                decoded_token_obj = paseto.decode(PASETO_KEY, paseto_token)
                decoded_token = json.loads(decoded_token_obj.payload)
                expiration_time = datetime.fromisoformat(decoded_token['exp'])
                if expiration_time < datetime.now(timezone.utc):
                    return jsonify({"msg": "Token has expired"}), 401
                g.current_user_identity = decoded_token['identity']
                return fn(*args, **kwargs)
            except Exception as e:
                logger.error(f"PASETO validation failed: {e}")
                return jsonify({"msg": "Invalid or tampered token"}), 401
        return decorator
    return wrapper

# Helper to get current user identity (replaces get_jwt_identity)
def get_paseto_identity():
    return getattr(g, 'current_user_identity', None)

# Helper to unset PASETO cookie (replaces unset_jwt_cookies)
def unset_paseto_cookies(response):
    response.set_cookie(
        PASETO_COOKIE_NAME, '', expires=0, path=PASETO_COOKIE_PATH,
        secure=PASETO_COOKIE_SECURE,
        httponly=PASETO_COOKIE_HTTPONLY,
        samesite=PASETO_COOKIE_SAMESITE
    )

# Helper to set PASETO cookie (replaces set_access_cookies)
def set_paseto_cookies(response, token_value):
    response.set_cookie(
        PASETO_COOKIE_NAME, token_value,
        expires=datetime.now(timezone.utc) + PASETO_TOKEN_EXPIRES,
        path=PASETO_COOKIE_PATH,
        secure=PASETO_COOKIE_SECURE,
        httponly=PASETO_COOKIE_HTTPONLY,
        samesite=PASETO_COOKIE_SAMESITE
    )


# --- Core Authentication Routes ---

@app.route("/login", methods=["POST"])
def login():
    db: Session = next(get_db())
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    logger.info(f"Login attempt for username: {username}")

    user = db.query(User).filter(User.username == username).first()

    if user and verify_password(password, user.hashed_password):
        user_data = {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "department": user.department,
            "role": get_frontend_role(user.role),
            "is_active": user.is_active
        }

        # Create PASETO token
        payload = {
            "identity": user.username,
            "exp": (datetime.now(timezone.utc) + PASETO_TOKEN_EXPIRES).isoformat(),
            "iat": datetime.now(timezone.utc).isoformat()
        }
        paseto = Paseto.new(2, "local")
        new_paseto_token = paseto.encode(PASETO_KEY, json.dumps(payload))
        if isinstance(new_paseto_token, bytes):
            new_paseto_token = new_paseto_token.decode("utf-8")

        response = make_response(jsonify({
            "message": "Login successful",
            "user": user_data,
        }), 200)
        set_paseto_cookies(response, new_paseto_token)
        return response
    else:
        logger.warning(f"Login failed for username: {username}. Invalid credentials.")
        return jsonify({"detail": "Invalid username or password"}), 401

@app.route("/logout", methods=["POST"])
@paseto_required(optional=True) # Use the new PASETO decorator
def logout():
    response = make_response(jsonify({"message": "Successfully logged out"}), 200)
    unset_paseto_cookies(response)
    try:
        user_identity = get_paseto_identity()
        username_for_log = user_identity if user_identity else 'unknown_user'
        logger.info(f"User {username_for_log} logged out. PASETO cookie unset.")
    except Exception as e:
        logger.error(f"Error getting PASETO identity during logout for logging purposes: {e}")
        logger.info("User logout requested, cookie removed (identity could not be determined).")
    return response

@app.route("/verify_auth", methods=["GET"])
@paseto_required(optional=True) # Use the new PASETO decorator
def verify_auth():
    db: Session = next(get_db())
    current_username = get_paseto_identity() # Use the new PASETO identity getter

    if current_username:
        user = db.query(User).filter(User.username == current_username).first()
        if user:
            user_data = {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "email": user.email,
                "department": user.department,
                "role": get_frontend_role(user.role),
                "is_active": user.is_active
            }
            logger.info(f"Verify Auth: User {current_username} authenticated and user data retrieved.")
            
            # Re-issue PASETO token to refresh its lifespan
            payload = {
                "identity": user.username,
                "exp": (datetime.now(timezone.utc) + PASETO_TOKEN_EXPIRES).isoformat(),
                "iat": datetime.now(timezone.utc).isoformat()
            }
            paseto_instance = Paseto.new(2, "local")
            new_paseto_token = paseto_instance.encode(PASETO_KEY, json.dumps(payload))
            if isinstance(new_paseto_token, bytes):
                new_paseto_token = new_paseto_token.decode("utf-8")

            response = make_response(jsonify({
                "isAuthenticated": True,
                "message": "Authenticated",
                "user": user_data
            }), 200)
            set_paseto_cookies(response, new_paseto_token)
            return response
        else:
            logger.warning(f"Verify Auth: Token provided for user {current_username}, but user not found in DB.")
            response = make_response(jsonify({
                "isAuthenticated": False,
                "message": "User associated with token not found"
            }), 401)
            unset_paseto_cookies(response)
            return response
    else:
        logger.info("Verify Auth: No valid token or token expired/invalid. Not authenticated.")
        response = make_response(jsonify({
            "isAuthenticated": False,
            "message": "Not authenticated or session expired"
        }), 401)
        unset_paseto_cookies(response)
        return response

# --- Password Reset Request ---
@app.route("/request_password_reset", methods=["POST"])
def request_password_reset():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"detail": "Email is required"}), 400

    db: Session = next(get_db())
    user = db.query(User).filter(User.email == email).first()
    db.close()

    if not user:
        print(f"Password reset requested for non-existent email: {email}. (Simulated)")
        return jsonify({"message": "If an account with that email exists, a password reset link has been sent."}), 200

    reset_token = secrets.token_urlsafe(32)
    print(f"\n--- SIMULATED Password Reset Link for {user.username} ({user.email}) ---")
    print(f"Reset Link: http://localhost:8081/reset_password?token={reset_token}")
    print("-------------------------------------------------------------------\n")

    return jsonify({"message": "If an account with that email exists, a password reset link has been sent."}), 200

# --- Register Blueprints ---
app.register_blueprint(user_bp)
# IMPORTANT: Update all blueprint registrations to use the new paseto_required decorator
# You will need to manually change @jwt_required() to @paseto_required() in each route file.
app.register_blueprint(permission_bp)
app.register_blueprint(survey_bp)  # Remove url_prefix here, since it's already in the blueprint
try:
    app.register_blueprint(department_bp, url_prefix='/api')
except NameError:
    logger.warning("Department blueprint (department_bp) not found or not imported. Skipping registration.")

# --- Basic Home Route ---
@app.route('/')
def home():
    """Basic home route to confirm API is running."""
    return "Survey Backend API is running!"

# --- Application Entry Point ---
if __name__ == '__main__':
    logger.info(f"Flask app running on http://0.0.0.0:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')
