from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import SurveyResponse, Department, User
from backend.utils.paseto_utils import paseto_required, get_paseto_identity

remarks_bp = Blueprint('remarks', __name__, url_prefix='/api/remarks')

# --- Get Incoming Feedback ---
@remarks_bp.route('/incoming', methods=['GET'])
@paseto_required()
def get_incoming_feedback():
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify([])

        # Get feedback for this user's department where response is not yet filled and rating is 1 or 2
        feedbacks = db.query(SurveyResponse).filter(
            SurveyResponse.to_department_id == user.department_id,
            SurveyResponse.rating.in_([1, 2]),
            (SurveyResponse.explanation == None) | (SurveyResponse.explanation == '')
        ).all()

        result = []
        for fb in feedbacks:
            from_dept = db.query(Department).filter(Department.id == fb.from_department_id).first()
            result.append({
                "id": fb.id,
                "fromDepartment": from_dept.name if from_dept else "Unknown",
                "ratingGiven": fb.rating,
                "remark": fb.remark,
                "category": None  # Add if you have category info
            })
        return jsonify(result)
    finally:
        db.close()

# --- Submit Response to Incoming Feedback ---
@remarks_bp.route('/respond', methods=['POST'])
@paseto_required()
def submit_feedback_response():
    db: Session = SessionLocal()
    try:
        data = request.get_json()
        feedback_id = data.get('id')
        explanation = data.get('explanation')
        action_plan = data.get('action_plan')
        responsible_person = data.get('responsible_person')

        feedback = db.query(SurveyResponse).filter(SurveyResponse.id == feedback_id).first()
        if not feedback:
            return jsonify({"detail": "Feedback not found"}), 404

        feedback.explanation = explanation
        feedback.action_plan = action_plan
        feedback.responsible_person = responsible_person
        db.commit()
        return jsonify({"message": "Response submitted successfully"})
    finally:
        db.close()

# --- Get Outgoing Feedback ---
@remarks_bp.route('/outgoing', methods=['GET'])
@paseto_required()
def get_outgoing_feedback():
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify([])

        # Get feedback where this user's department gave the low rating and response is filled
        feedbacks = db.query(SurveyResponse).filter(
            SurveyResponse.from_department_id == user.department_id,
            SurveyResponse.rating.in_([1, 2]),
            SurveyResponse.explanation != None,
            SurveyResponse.explanation != ''
        ).all()

        result = []
        for fb in feedbacks:
            to_dept = db.query(Department).filter(Department.id == fb.to_department_id).first()
            result.append({
                "id": fb.id,
                "department": to_dept.name if to_dept else "Unknown",
                "rating": fb.rating,
                "yourRemark": fb.remark,
                "category": None,  # Add if you have category info
                "theirResponse": {
                    "explanation": fb.explanation,
                    "actionPlan": fb.action_plan,
                    "responsiblePerson": fb.responsible_person
                },
                "acknowledged": fb.acknowledged
            })
        return jsonify(result)
    finally:
        db.close()

# --- Acknowledge Outgoing Feedback ---
@remarks_bp.route('/acknowledge', methods=['POST'])
@paseto_required()
def acknowledge_feedback():
    db: Session = SessionLocal()
    try:
        data = request.get_json()
        feedback_id = data.get('id')
        feedback = db.query(SurveyResponse).filter(SurveyResponse.id == feedback_id).first()
        if not feedback:
            return jsonify({"detail": "Feedback not found"}), 404

        feedback.acknowledged = True
        db.commit()
        return jsonify({"message": "Feedback acknowledged"})
    finally:
        db.close()