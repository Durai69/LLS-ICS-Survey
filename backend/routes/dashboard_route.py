from flask import Blueprint, jsonify
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import SurveyResponse, Department, User
from backend.utils.paseto_utils import paseto_required, get_paseto_identity

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/department-ratings', methods=['GET'])
@paseto_required()
def get_department_ratings():
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.department_id:
            return jsonify([])

        # Get all overall ratings given to the user's department (to_department_id)
        results = (
            db.query(
                SurveyResponse.from_department_id,
                Department.name,
                SurveyResponse.overall_rating
            )
            .join(Department, SurveyResponse.from_department_id == Department.id)
            .filter(
                SurveyResponse.to_department_id == user.department_id,
                SurveyResponse.overall_rating != None
            )
            .all()
        )

        # Aggregate by department (average if multiple ratings)
        dept_ratings = {}
        for from_dept_id, dept_name, rating in results:
            if dept_name not in dept_ratings:
                dept_ratings[dept_name] = []
            dept_ratings[dept_name].append(rating)

        data = [
            {"name": dept, "rating": round(sum(ratings) / len(ratings), 2)}
            for dept, ratings in dept_ratings.items()
        ]
        return jsonify(data)
    finally:
        db.close()