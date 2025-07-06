# routes/user_routes.py
import json
from flask import Blueprint, request, jsonify, make_response
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User
from backend.security import hash_password, verify_password, get_frontend_role
from backend.utils.paseto_utils import PASETO_KEY, paseto, paseto_required
from pyseto import Paseto
from datetime import datetime, timedelta, timezone

user_bp = Blueprint('user_bp', __name__, url_prefix='/api')

# Helper function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET all users
@user_bp.route('/users', methods=['GET'])
@paseto_required() # Protect this route with PASETO authentication
def get_users():
    db: Session = next(get_db())
    users = db.query(User).all()

    users_data = []
    for user in users:
        users_data.append({
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "department": user.department,
            "role": get_frontend_role(user.role), # Normalize role for frontend
            "is_active": user.is_active,
            "status": "Submitted" if user.created_at else "Not Submitted"
        })
    return jsonify(users_data)

# POST (Create) a new user
@user_bp.route('/users', methods=['POST'])
@paseto_required()
def create_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    email = data.get('email')
    department = data.get('department')
    role = data.get('role', 'Rep')

    if not all([username, password, name, email, department]):
        return jsonify({"message": "Missing required fields"}), 400

    db: Session = next(get_db())

    if db.query(User).filter((User.username == username) | (User.email == email)).first():
        return jsonify({"message": "User with this username or email already exists"}), 409

    hashed_password = hash_password(password)

    new_user = User(
        username=username,
        name=name,
        email=email,
        department=department,
        hashed_password=hashed_password,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return jsonify({
        "id": new_user.id,
        "username": new_user.username,
        "name": new_user.name,
        "email": new_user.email,
        "department": new_user.department,
        "role": get_frontend_role(new_user.role),
        "is_active": new_user.is_active,
        "status": "Not Submitted"
    }), 201

# PUT (Update) an existing user
@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@paseto_required()
def update_user(user_id):
    data = request.get_json()
    db: Session = next(get_db())
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'department' in data:
        user.department = data['department']
    if 'role' in data:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = data['is_active']

    db.commit()
    db.refresh(user)

    return jsonify({
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "role": get_frontend_role(user.role),
        "is_active": user.is_active,
        "status": "Submitted" if user.created_at else "Not Submitted"
    })

# DELETE a user
@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@paseto_required()
def delete_user(user_id):
    db: Session = next(get_db())
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    db.delete(user)
    db.commit()

    return jsonify({"message": "User deleted successfully"}), 200

# Example function to demonstrate PASETO token encoding
def create_paseto_token(payload):
    """
    Create a PASETO token for the given payload.

    Args:
        payload (dict): The payload to encode in the token.

    Returns:
        str: The encoded PASETO token.
    """
    # Encode the payload using PASETO
    paseto_token = paseto.encode(PASETO_KEY, json.dumps(payload))
    return paseto_token

# In your login route (user_routes.py or similar)
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    db: Session = next(get_db())
    user = db.query(User).filter(User.username == username).first()

    if user and verify_password(password, user.hashed_password):
        # Generate token
        payload = {
            "identity": user.username,
            "exp": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "iat": datetime.now(timezone.utc).isoformat()
        }
        paseto_instance = Paseto.new(2, "local")
        token = paseto_instance.encode(PASETO_KEY, json.dumps(payload))
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        user_data = {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "department": user.department,
            "role": get_frontend_role(user.role),
            "is_active": user.is_active
        }
        resp = make_response(jsonify({
            "message": "Login successful",
            "user": user_data
        }))
        resp.set_cookie(
            "paseto_token_cookie",
            token,
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
            domain="localhost"  # <-- Add this line if you want to be explicit
        )
        return resp
    else:
        return jsonify({"detail": "Invalid credentials"}), 401
