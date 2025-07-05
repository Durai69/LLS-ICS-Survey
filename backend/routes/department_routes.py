# backend/routes/department_routes.py
from flask import Blueprint, jsonify, request
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import Department, User
from backend.schemas import DepartmentSchema
import logging

from backend.utils.paseto_utils import paseto_required, get_paseto_identity

department_bp = Blueprint('department_routes', __name__)
logger = logging.getLogger(__name__)

# Helper function to get a database session for each request
# This is defined here because it's not exported from database.py
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@department_bp.route("/departments", methods=["GET"])
@paseto_required() # Changed from @jwt_required()
def get_departments():
    """
    Retrieves all active departments.
    Requires PASETO authentication.
    Returns:
        JSON: A list of department objects, each with 'id' and 'name'.
    """
    # You can still access current user identity if needed for filtering/logging
    # current_user_identity = get_paseto_identity()

    db: Session = next(get_db())
    try:
        departments = db.query(Department).order_by(Department.name).all()
        
        # Using DepartmentSchema for serialization, as defined in schemas.py
        # This ensures consistent output structure
        # NOTE: You'll need to ensure DepartmentSchema is compatible with your Department model
        departments_data = [DepartmentSchema.from_orm(dept).model_dump() for dept in departments]
        
        logger.info(f"Fetched {len(departments_data)} departments.")
        return jsonify(departments_data), 200
    except Exception as e:
        logger.error(f"Error fetching departments: {e}", exc_info=True) # Log full traceback
        return jsonify({"message": "Internal server error fetching departments"}), 500
    finally:
        db.close()

# Example POST route for creating a department (if needed, ensure role-based access)
# @department_bp.route("/departments", methods=["POST"])
# @paseto_required() # Changed from @jwt_required()
# def create_department():
#     """
#     Creates a new department. Requires PASETO authentication (e.g., admin role).
#     """
#     # Implement role check here: e.g., if get_paseto_identity().get('role') != 'admin': return 403
#     data = request.get_json()
#     dept_name = data.get('name')
#     if not dept_name:
#         return jsonify({"message": "Department name is required"}), 400
    
#     db: Session = next(get_db())
#     try:
#         existing_dept = db.query(Department).filter(Department.name.ilike(dept_name)).first()
#         if existing_dept:
#             return jsonify({"message": f"Department '{dept_name}' already exists"}), 409

#         new_dept = Department(name=dept_name)
#         db.add(new_dept)
#         db.commit()
#         db.refresh(new_dept)
#         logger.info(f"Created new department: {new_dept.name}")
#         return jsonify(DepartmentSchema.from_orm(new_dept).model_dump()), 201
#     except Exception as e:
#         db.rollback()
#         logger.error(f"Error creating department: {e}", exc_info=True)
#         return jsonify({"message": f"Internal server error: {str(e)}"}), 500
#     finally:
#         db.close()
