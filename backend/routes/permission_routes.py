# F:\LLS Survey\backend\routes\permission_routes.py
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Department, Permission, User
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from datetime import timezone

# Import PASETO decorators and getters directly from utils.paseto_utils
from utils.paseto_utils import paseto_required, get_paseto_identity
# Import get_frontend_role from security.py (where it's defined)
from security import get_frontend_role

permission_bp = Blueprint('permission_bp', __name__, url_prefix='/api')

# Helper function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET all departments (for admin matrix headers/rows)
@permission_bp.route('/departments', methods=['GET'])
@paseto_required(optional=True)
def get_departments():
    db: Session = next(get_db())
    departments = db.query(Department).order_by(Department.name).all()
    
    departments_data = [{"id": dept.id, "name": dept.name} for dept in departments]
    return jsonify(departments_data), 200

# POST (Create) a new department (likely used elsewhere, but kept here)
@permission_bp.route('/departments', methods=['POST'])
@paseto_required()
def create_department():
    data = request.get_json()
    dept_name = data.get('name')

    if not dept_name:
        return jsonify({"message": "Department name is required"}), 400

    db: Session = next(get_db())
    try:
        existing_dept = db.query(Department).filter(Department.name.ilike(dept_name)).first()
        if existing_dept:
            return jsonify({"message": f"Department '{dept_name}' already exists"}), 409

        new_dept = Department(name=dept_name)
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
        return jsonify({"id": new_dept.id, "name": new_dept.name}), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Database integrity error. Department might already exist (duplicate)."}), 409
    except Exception as e:
        db.rollback()
        print(f"Error creating department: {e}")
        return jsonify({"message": f"Internal server error: {str(e)}"}), 500
    finally:
        db.close()

# GET existing permissions (for populating the admin matrix on load)
@permission_bp.route('/permissions', methods=['GET'])
@paseto_required()
def get_permissions():
    db = SessionLocal()
    try:
        permissions = db.query(Permission).all()
        result = []
        for perm in permissions:
            result.append({
                "from_department_id": perm.from_dept_id,  # <-- map to frontend expected key
                "to_department_id": perm.to_dept_id,      # <-- map to frontend expected key
                "can_survey_self": perm.can_survey_self,
                "start_date": perm.start_date.isoformat() if perm.start_date else None,
                "end_date": perm.end_date.isoformat() if perm.end_date else None,
            })
        return jsonify(result), 200
    finally:
        db.close()

# POST to save permissions (replace all existing with new list)
@permission_bp.route('/permissions', methods=['POST'])
@paseto_required()
def set_permissions():
    data = request.get_json()
    allowed_pairs = data.get('allowed_pairs', [])
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not isinstance(allowed_pairs, list):
        return jsonify({"message": "Invalid data format. 'allowed_pairs' must be a list."}), 400
    if not start_date_str or not end_date_str:
        return jsonify({"message": "Start date and end date are required."}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"message": "Invalid date format. Expected ISO string (e.g.,YYYY-MM-DDTHH:MM:SS.sssZ)."}), 400

    db: Session = next(get_db())
    try:
        db.query(Permission).delete()
        db.commit()
        print("Existing permissions wiped from DB.")

        new_permission_objects = []
        for pair in allowed_pairs:
            from_dept_id = pair.get('from_dept_id')
            to_dept_id = pair.get('to_dept_id')
            can_survey_self = pair.get('can_survey_self', False)

            if from_dept_id is None or to_dept_id is None:
                print(f"Skipping permission: Invalid pair format - from_dept_id or to_dept_id missing. Pair: {pair}")
                continue

            from_dept_exists = db.query(Department).filter_by(id=from_dept_id).first()
            to_dept_exists = db.query(Department).filter_by(id=to_dept_id).first()

            if not from_dept_exists or not to_dept_exists:
                print(f"Skipping permission: Department not found. From ID: {from_dept_id}, To ID: {to_dept_id}. Pair: {pair}")
                continue

            if from_dept_id == to_dept_id and not can_survey_self:
                print(f"Skipping self-survey for department {from_dept_id} as can_survey_self is false.")
                continue

            new_permission_objects.append(
                Permission(
                 from_dept_id=from_dept_id,    # <-- FIXED
                 to_dept_id=to_dept_id,        # <-- FIXED
                  start_date=start_date,   # <-- must match model
                    end_date=end_date,
        can_survey_self=can_survey_self
    )
)
        
        db.add_all(new_permission_objects)
        db.commit()
        print(f"Saved {len(new_permission_objects)} new permission entries.")
        return jsonify({"message": "Permissions saved successfully"}), 200

    except IntegrityError as e:
        db.rollback()
        print(f"Integrity error during permission setting: {e}")
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        db.rollback()
        print(f"Error setting permissions: {e}")
        return jsonify({"message": f"An unexpected error occurred: {str(e)}"}), 500
    finally:
        db.close()


# POST for Mail Alert Users
@permission_bp.route('/permissions/mail-alert', methods=['POST'])
@paseto_required()
def mail_alert_users():
    data = request.get_json()
    allowed_pairs = data.get('allowed_pairs', [])
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not allowed_pairs or not start_date_str or not end_date_str:
        return jsonify({"message": "Missing allowed_pairs or date range for mail alert"}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"message": "Invalid date format. Expected ISO string."}), 400

    db: Session = next(get_db())
    
    department_names_map = {dept.id: dept.name for dept in db.query(Department).all()}
    from_dept_ids = {pair['from_dept_id'] for pair in allowed_pairs if 'from_dept_id' in pair}
    
    users_to_alert = []
    for dept_id in from_dept_ids:
        dept_name = department_names_map.get(dept_id)
        if dept_name:
            users_in_dept = db.query(User).filter(User.department == dept_name).all()
            users_to_alert.extend(users_in_dept)

    alert_summary = []
    if not users_to_alert:
        print("No users found in the relevant departments for mail alert.")
        return jsonify({"message": "Mail alert process initiated. No relevant users found for simulation."}), 200

    for user in users_to_alert:
        user_dept_id = next((d_id for d_id, d_name in department_names_map.items() if d_name == user.department), None)
        
        if user_dept_id is None:
            continue

        relevant_permissions_for_user = [
            pair for pair in allowed_pairs 
            if pair['from_dept_id'] == user_dept_id
        ]
        
        surveyable_depts_names = []
        for p in relevant_permissions_for_user:
            to_dept_name = department_names_map.get(p['to_dept_id'])
            if to_dept_name:
                surveyable_depts_names.append(to_dept_name)

        if surveyable_depts_names:
            alert_summary.append(
                f"Simulating email to user '{user.username}' ({user.email}) from department '{user.department}'. "
                f"Can now survey: {', '.join(surveyable_depts_names)}. Survey period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}."
            )
            print(alert_summary[-1])

    return jsonify({
        "message": "Mail alert process initiated (simulated). Check backend logs for details.",
        "alert_details": alert_summary
    }), 200

# NEW ENDPOINT: Get departments that the logged-in user's department can survey (for User Frontend)
@permission_bp.route('/surveyable-departments', methods=['GET'])
@paseto_required()
def get_surveyable_departments():
    db: Session = next(get_db())
    current_username = get_paseto_identity()
    
    try:
        current_user = db.query(User).filter(User.username == current_username).first()
        if not current_user:
            return jsonify({"detail": "User not found."}), 404
        
        from_department_obj = db.query(Department).filter(Department.name == current_user.department).first()
        if not from_department_obj:
            return jsonify({"detail": f"Department '{current_user.department}' not found or registered."}), 404
        
        from_department_id = from_department_obj.id
        current_date = datetime.now(timezone.utc)

        surveyable_permissions = db.query(Permission).filter(
            Permission.from_department_id == from_department_id,
            Permission.start_date <= current_date,
            Permission.end_date >= current_date
        ).all()

        surveyable_departments_data = []
        for perm in surveyable_permissions:
            to_dept = db.query(Department).filter_by(id=perm.to_department_id).first()
            if to_dept:
                if perm.from_department_id == perm.to_department_id and not perm.can_survey_self:
                    continue
                
                surveyable_departments_data.append({
                    "id": to_dept.id,
                    "name": to_dept.name
                })
        
        surveyable_departments_data.sort(key=lambda x: x['name'])

        if not surveyable_departments_data:
            return jsonify({"message": "No departments are currently available for you to survey."}), 200

        return jsonify(surveyable_departments_data), 200

    except Exception as e:
        print(f"Error fetching surveyable departments: {e}")
        return jsonify({"detail": f"An error occurred fetching surveyable departments: {str(e)}"}), 500
    finally:
        db.close()
