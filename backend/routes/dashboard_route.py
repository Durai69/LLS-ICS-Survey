from flask import Blueprint, jsonify
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import SessionLocal
from backend.models import SurveyResponse, Department, User, Survey, SurveySubmission
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

@dashboard_bp.route('/admin-stats', methods=['GET'])
@paseto_required()
def get_admin_dashboard_stats():
    db: Session = SessionLocal()
    try:
        # Total surveys assigned
        total_surveys_assigned = db.query(Survey).count()
        # Total surveys submitted
        total_surveys_submitted = db.query(SurveySubmission).count()
        # Surveys not submitted
        surveys_not_submitted = total_surveys_assigned - total_surveys_submitted

        # Department performance: average super_overall for each department (from SurveyResponse)
        dept_performance = (
            db.query(Department.name, func.avg(SurveyResponse.super_overall))
            .join(SurveyResponse, SurveyResponse.to_department_id == Department.id)
            .filter(SurveyResponse.super_overall != None)
            .group_by(Department.name)
            .all()
        )
        department_performance = [
            {"name": name, "super_overall": round(avg or 0, 2)}
            for name, avg in dept_performance
        ]

        # Departments below 80%
        below_80_departments = [
            d["name"] for d in department_performance if d["super_overall"] < 80
        ]

        return jsonify({
            "total_surveys_assigned": total_surveys_assigned,
            "total_surveys_submitted": total_surveys_submitted,
            "surveys_not_submitted": surveys_not_submitted,
            "department_performance": department_performance,
            "below_80_departments": below_80_departments
        })
    finally:
        db.close()

@dashboard_bp.route('/pending-surveys', methods=['GET'])
@paseto_required()
def get_departments_pending_surveys():
    db: Session = SessionLocal()
    try:
        # Total surveys assigned count
        total_assigned = db.query(func.count(Survey.id)).scalar()

        # Total surveys submitted count (excluding drafts)
        total_submitted = db.query(func.count(SurveySubmission.id)).filter(SurveySubmission.status != 'Draft').scalar()

        # Total surveys not submitted count
        total_not_submitted = total_assigned - total_submitted

        # Subquery: surveys assigned to departments (managing_department_id)
        assigned_surveys_subq = db.query(
            Survey.id.label('survey_id'),
            Survey.managing_department_id.label('dept_id')
        ).subquery()

        # Subquery: surveys submitted by departments (excluding drafts)
        submitted_surveys_subq = db.query(
            SurveySubmission.survey_id.label('survey_id'),
            SurveySubmission.submitter_department_id.label('dept_id')
        ).filter(SurveySubmission.status != 'Draft').subquery()

        # Find surveys assigned but not submitted by the same department
        pending_surveys_subq = db.query(
            assigned_surveys_subq.c.dept_id,
            func.count(assigned_surveys_subq.c.survey_id).label('pending_count')
        ).outerjoin(
            submitted_surveys_subq,
            (assigned_surveys_subq.c.survey_id == submitted_surveys_subq.c.survey_id) &
            (assigned_surveys_subq.c.dept_id == submitted_surveys_subq.c.dept_id)
        ).filter(
            submitted_surveys_subq.c.survey_id == None
        ).group_by(
            assigned_surveys_subq.c.dept_id
        ).subquery()

        # Query department names and pending counts
        pending_departments = db.query(
            Department.name,
            pending_surveys_subq.c.pending_count
        ).join(
            pending_surveys_subq,
            Department.id == pending_surveys_subq.c.dept_id
        ).all()

        # Format response as list of dicts with name and pending_count
        response = [{"name": d.name, "pending_count": d.pending_count} for d in pending_departments]

        # Optionally, add total_not_submitted count for reference
        return jsonify({
            "total_not_submitted": total_not_submitted,
            "pending_departments": response
        })
    finally:
        db.close()

