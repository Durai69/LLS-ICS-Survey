# backend/utils/paseto_utils.py
# This file contains PASETO configuration, token creation, validation,
# and cookie management functions, extracted to prevent circular imports.

import os
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g, make_response
from pyseto import Paseto, Key
import logging

logger = logging.getLogger(__name__)

# --- PASETO Configuration ---
# PASETO V2 Local requires a 32-byte (256-bit) symmetric key.
# It's crucial to generate a strong, random key and store it securely (e.g., in .env).
# For development, you can generate one with: secrets.token_bytes(32).hex()
PASETO_SECRET_KEY_HEX = os.getenv("PASETO_SECRET_KEY", secrets.token_bytes(32).hex())
if len(PASETO_SECRET_KEY_HEX) != 64: # 32 bytes = 64 hex characters
    raise ValueError("PASETO_SECRET_KEY must be a 64-character hex string (32 bytes).")

# FIX: Removed 'alg' argument from Key.new() as it's not expected for symmetric keys.
# The algorithm 'v2.local' is specified when calling Paseto.encrypt/decrypt.
# FIX: 'k' is not an expected keyword argument for Key.new() for symmetric keys.
# Pass the raw key bytes as a positional argument.
PASETO_KEY = Key.new(version=2, purpose="local", key=bytes.fromhex(PASETO_SECRET_KEY_HEX))
# or, if your pyseto version uses positional args:
# PASETO_KEY = Key.new("v2", "local", bytes.fromhex(PASETO_SECRET_KEY_HEX))
PASETO_TOKEN_EXPIRES = timedelta(hours=1) # Token expires after 1 hour

# Cookie settings for PASETO token
PASETO_COOKIE_NAME = 'paseto_token_cookie'
PASETO_COOKIE_SECURE = False # Set to True in production for HTTPS
PASETO_COOKIE_HTTPONLY = True # Keep True for security (JS cannot access)
PASETO_COOKIE_DOMAIN = 'localhost' # Must match your frontend's hostname
PASETO_COOKIE_PATH = '/'
PASETO_COOKIE_SAMESITE = "Lax"

# --- PASETO Authentication Decorator ---
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
                # Use paseto.decode for validation (pyseto >=1.6.0)
                decoded_token = paseto.decode(PASETO_KEY, paseto_token)
                import json
                payload = json.loads(decoded_token.payload)
                # Check expiration
                expiration_time = datetime.fromisoformat(payload['exp'])
                if expiration_time < datetime.now(timezone.utc):
                    return jsonify({"msg": "Token has expired"}), 401
                g.current_user_identity = payload['identity']
                return fn(*args, **kwargs)
            except Exception as e:
                logger.error(f"PASETO validation failed: {e}")
                return jsonify({"msg": "Invalid or tampered token"}), 401
        return decorator
    return wrapper

# Helper to get current user identity
def get_paseto_identity():
    return getattr(g, 'current_user_identity', None)

# Helper to unset PASETO cookie
def unset_paseto_cookies(response):
    response.set_cookie(PASETO_COOKIE_NAME, '', expires=0, path=PASETO_COOKIE_PATH,
                        domain=PASETO_COOKIE_DOMAIN, secure=PASETO_COOKIE_SECURE,
                        httponly=PASETO_COOKIE_HTTPONLY, samesite=PASETO_COOKIE_SAMESITE)

# Helper to set PASETO cookie
def set_paseto_cookies(response, token_value):
    response.set_cookie(PASETO_COOKIE_NAME, token_value,
                        expires=datetime.now(timezone.utc) + PASETO_TOKEN_EXPIRES,
                        path=PASETO_COOKIE_PATH, domain=PASETO_COOKIE_DOMAIN,
                        secure=PASETO_COOKIE_SECURE, httponly=PASETO_COOKIE_HTTPONLY,
                        samesite=PASETO_COOKIE_SAMESITE)

# Function to create a new PASETO token (used in login)
def create_paseto_token(identity: str) -> str:
    payload = {
        "identity": identity,
        "exp": (datetime.now(timezone.utc) + PASETO_TOKEN_EXPIRES).isoformat(),
        "iat": datetime.now(timezone.utc).isoformat()
    }
    # FIX: Explicitly pass 'alg' to Paseto.encrypt
    return Paseto.encrypt(PASETO_KEY, payload, alg='v2.local').decode('utf-8')

paseto = Paseto.new(2, "local")

def decode_token(token):
    return paseto.decode(PASETO_KEY, token)
