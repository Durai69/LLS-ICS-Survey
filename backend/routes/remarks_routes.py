from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import SurveyResponse, Department, User, Question
from backend.utils.paseto_utils import paseto_required, get_paseto_identity
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

remarks_bp = Blueprint('remarks', __name__, url_prefix='/api/remarks')

# --- Get Incoming Feedback ---
@remarks_bp.route('/incoming', methods=['GET'])
@paseto_required()
def get_incoming_feedback():
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.department_id:
            return jsonify([])

        user_dept = db.query(Department).filter(Department.id == user.department_id).first()
        if not user_dept:
            return jsonify([])

        feedbacks = db.query(SurveyResponse).filter(
            SurveyResponse.to_department_id == user_dept.id,
            SurveyResponse.rating.in_([1, 2]),
            (SurveyResponse.explanation == None) | (SurveyResponse.explanation == '')
        ).all()

        # DEBUG: Print what is fetched from DB
        print("INCOMING FEEDBACKS:", [f"{fb.id=} {fb.from_department_id=} {fb.to_department_id=} {fb.rating=} {fb.remark=} {fb.explanation=}" for fb in feedbacks])

        result = []
        for fb in feedbacks:
            from_dept = db.query(Department).filter(Department.id == fb.from_department_id).first()
            category = None
            if fb.question_id:
                question = db.query(Question).filter(Question.id == fb.question_id).first()
                category = question.category if question else None
            result.append({
                "id": fb.id,
                "fromDepartment": from_dept.name if from_dept else "Unknown",
                "ratingGiven": fb.rating,
                "remark": fb.remark,
                "category": category
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
        if not user or not user.department_id:
            return jsonify([])

        user_dept = db.query(Department).filter(Department.id == user.department_id).first()
        if not user_dept:
            return jsonify([])

        feedbacks = db.query(SurveyResponse).filter(
            SurveyResponse.from_department_id == user_dept.id,
            SurveyResponse.rating.in_([1, 2]),
            SurveyResponse.explanation != None,
            SurveyResponse.explanation != '',
            SurveyResponse.acknowledged == False  # Only show unacknowledged
        ).all()

        # DEBUG: Print what is fetched from DB
        print("OUTGOING FEEDBACKS:", [f"{fb.id=} {fb.from_department_id=} {fb.to_department_id=} {fb.rating=} {fb.remark=} {fb.explanation=}" for fb in feedbacks])

        result = []
        for fb in feedbacks:
            to_dept = db.query(Department).filter(Department.id == fb.to_department_id).first()
            category = None
            if fb.question_id:
                question = db.query(Question).filter(Question.id == fb.question_id).first()
                category = question.category if question else None
            result.append({
                "id": fb.id,
                "department": to_dept.name if to_dept else "Unknown",
                "rating": fb.rating,
                "yourRemark": fb.remark,
                "category": category,
                "theirResponse": {
                    "explanation": fb.explanation,
                    "actionPlan": fb.action_plan,
                    "responsiblePerson": fb.responsible_person
                },
                "acknowledged": bool(fb.acknowledged)
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
