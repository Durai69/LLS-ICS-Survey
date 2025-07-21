from flask import Blueprint, request, jsonify, send_file
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from backend.database import SessionLocal
from backend.models import Survey, Question, Option, Answer, User, Department, SurveySubmission, Permission, SurveyResponse
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone

from backend.utils.paseto_utils import paseto_required, get_paseto_identity
from backend.scripts.populate_surveys_from_permissions import populate_surveys_from_permissions
from backend.scripts.populate_question_options import populate_question_options_for_ratings
from backend.scripts.populate_questions_for_surveys import populate_questions_for_all_surveys
from backend.scripts.populate_survey_responses import calculate_overall_rating

survey_bp = Blueprint('survey', __name__, url_prefix='/api')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_rating_description(overall_rating: float) -> str:
    if overall_rating >= 91:
        return "Excellent - Exceeds the Customer Expectation"
    elif overall_rating >= 75:
        return "Satisfactory - Meets the Customer requirement"
    elif overall_rating >= 70:
        return "Below Average - Identify areas for improvement and initiate action to eliminate dissatisfaction"
    else:
        return "Poor - Identify areas for improvement and initiate action to eliminate dissatisfaction"

# --- Assigned Surveys for User ---
@survey_bp.route('/assigned-surveys', methods=['GET'])
@paseto_required()
def get_assigned_surveys():
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify({"detail": "User not found"}), 404
        user_dept = db.query(Department).filter(Department.name == user.department).first()
        if not user_dept:
            return jsonify({"detail": "User's department not found"}), 404
        now = datetime.now(timezone.utc)
        allowed_perms = db.query(Permission).filter(
            Permission.from_dept_id == user_dept.id,
            Permission.start_date <= now,
            Permission.end_date >= now
        ).all()
        allowed_dept_ids = []
        for perm in allowed_perms:
            if perm.from_dept_id == perm.to_dept_id and not getattr(perm, "can_survey_self", False):
                continue
            allowed_dept_ids.append(perm.to_dept_id)
        if not allowed_dept_ids:
            return jsonify([])

        # --- FIX: Only show surveys managed by the user's department ---
        surveys = db.query(Survey).filter(
            Survey.rated_department_id.in_(allowed_dept_ids),
            Survey.managing_department_id == user_dept.id
        ).all()
        # -------------------------------------------------------------

        return jsonify([
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "rated_department_id": s.rated_department_id,
                "rated_dept_name": s.rated_department.name if s.rated_department else None,
                "managing_department_id": s.managing_department_id,
                "managing_dept_name": s.managing_department.name if s.managing_department else None,
            }
            for s in surveys
        ])
    finally:
        db.close()

# --- Get Survey and Questions ---
@survey_bp.route('/surveys/<int:survey_id>', methods=['GET'])
@paseto_required()
def get_survey_by_id(survey_id):
    db: Session = SessionLocal()
    try:
        survey = db.query(Survey).options(
            joinedload(Survey.questions).joinedload(Question.options),
            joinedload(Survey.managing_department),
            joinedload(Survey.rated_department)
        ).filter(Survey.id == survey_id).first()
        if not survey:
            return jsonify({"detail": "Survey not found"}), 404

        questions_data = []
        for question in survey.questions:
            q_data = {
                "id": question.id,
                "text": question.text,
                "type": question.type,
                "order": question.order,
                "category": question.category,
                "options": [
                    {"id": opt.id, "text": opt.text, "value": opt.value}
                    for opt in question.options
                ] if question.type == "multiple_choice" else []
            }
            questions_data.append(q_data)

        survey_data = {
            "id": survey.id,
            "title": survey.title,
            "description": survey.description,
            "created_at": survey.created_at.isoformat() if survey.created_at else None,
            "managing_department_id": survey.managing_department_id,
            "rated_department_id": survey.rated_department_id,
            "managing_dept_name": survey.managing_department.name if survey.managing_department else None,
            "rated_dept_name": survey.rated_department.name if survey.rated_department else None,
            "questions": sorted(questions_data, key=lambda q: q['order']),
        }
        return jsonify(survey_data), 200
    finally:
        db.close()

# --- Submit Survey Response ---
@survey_bp.route('/surveys/<int:survey_id>/submit_response', methods=['POST'])
@paseto_required()
def submit_survey_response(survey_id):
    db: Session = SessionLocal()
    try:
        data = request.get_json()
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify({"detail": "User not found"}), 404
        user_dept = db.query(Department).filter(Department.name == user.department).first()
        if not user_dept:
            return jsonify({"detail": "User's department not found."}), 404

        survey = db.query(Survey).filter(Survey.id == survey_id).first()
        if not survey:
            return jsonify({"detail": "Survey not found."}), 404

        now = datetime.now(timezone.utc)
        is_allowed_to_survey = db.query(Permission).filter(
            Permission.from_dept_id == user_dept.id,
            Permission.to_dept_id == survey.rated_department_id,
            Permission.start_date <= now,
            Permission.end_date >= now
        ).first()

        # Handle self-survey based on permission
        if user_dept.id == survey.rated_department_id:
            if not is_allowed_to_survey or not getattr(is_allowed_to_survey, "can_survey_self", False):
                return jsonify({"detail": "You cannot rate your own department unless explicitly permitted."}), 403
        elif not is_allowed_to_survey:
            return jsonify({"detail": "You are not authorized to rate this department."}), 403

        prev = db.query(SurveySubmission).filter(
            SurveySubmission.survey_id == survey_id,
            SurveySubmission.submitter_user_id == user.id,
            SurveySubmission.status != 'Draft'
        ).first()
        if prev:
            return jsonify({"detail": "You have already submitted this survey."}), 409

        answers = data.get('answers', [])
        suggestion = data.get('suggestion', '')

        questions = db.query(Question).filter(Question.survey_id == survey_id).all()
        question_ids = {q.id for q in questions}
        if len(answers) != len(questions):
            return jsonify({"detail": "All questions must be answered."}), 400

        for answer in answers:
            qid = answer.get('id')
            rating = answer.get('rating')
            remarks = answer.get('remarks', '')
            if qid not in question_ids:
                return jsonify({"detail": f"Invalid question ID: {qid}"}), 400
            if type(rating) is not int or rating not in [1, 2, 3, 4]:
                return jsonify({"detail": f"Invalid rating for question {qid}: {rating}. Must be integer 1, 2, 3, or 4."}), 400
            if rating in [1, 2] and not remarks.strip():
                return jsonify({"detail": f"Remarks required for low rating (1 or 2) for question {qid}."}), 400

        # Group answers by category
        answers_by_category = {}
        for question in questions:
            answers_by_category[question.category] = []

        for answer in answers:
            q = next((q for q in questions if q.id == answer.get('id')), None)
            if q:
                answers_by_category[q.category].append({
                    'question_id': q.id,
                    'rating': answer.get('rating'),
                    'remarks': answer.get('remarks', '')
                })

        import json
        answers_by_category_json = json.dumps(answers_by_category)

        # --- Only remove draft and its answers ONCE, before inserting new submission ---
        draft = db.query(SurveySubmission).filter(
            SurveySubmission.survey_id == survey_id,
            SurveySubmission.submitter_user_id == user.id,
            SurveySubmission.status == 'Draft'
        ).first()
        if draft:
            db.query(Answer).filter(Answer.submission_id == draft.id).delete()
            db.delete(draft)
            db.flush()  # Keep transaction atomic

        # Now insert the new submission
        submission = SurveySubmission(
            survey_id=survey.id,
            submitter_user_id=user.id,
            submitter_department_id=user_dept.id,
            rated_department_id=survey.rated_department_id,
            suggestions=suggestion,
            answers_by_category=answers_by_category_json,
            submitted_at=datetime.now(timezone.utc),
            status='Submitted'
        )
        db.add(submission)
        db.flush()

        for answer in answers:
            # Find the option ID for this rating
            option = db.query(Option).filter(
                Option.question_id == answer['id'],
                Option.value == str(answer['rating'])
            ).first()
            selected_option_id = option.id if option else None

            db.add(Answer(
                submission_id=submission.id,
                question_id=answer['id'],
                rating_value=answer['rating'],
                text_response=answer.get('remarks', ''),
                selected_option_id=selected_option_id
            ))

        # Insert into survey_responses for each low rating with remarks
        for answer in answers:
            if answer.get('rating', 0) in [1, 2] and answer.get('remarks', '').strip():
                sr = SurveyResponse(
                    survey_id=survey.id,
                    user_id=user.id,
                    survey_submission_id=submission.id,
                    question_id=answer['id'],
                    from_department_id=user_dept.id,
                    to_department_id=survey.rated_department_id,
                    rating=answer['rating'],
                    remark=answer.get('remarks', ''),
                    submitted_at=submission.submitted_at,
                    acknowledged=False,
                    overall_rating=None  # Only set for summary row
                )
                db.add(sr)

        # After saving all answers and before db.commit()
        db.flush()  # <-- Add this line

        # Now calculate overall_rating
        summary_sr = SurveyResponse(
            survey_id=survey.id,
            user_id=user.id,
            survey_submission_id=submission.id,
            from_department_id=user_dept.id,
            to_department_id=survey.rated_department_id,
            submitted_at=submission.submitted_at,
            acknowledged=False,
            overall_rating=calculate_overall_rating(db, submission.id),
            final_suggestion=suggestion if suggestion else None,
        )
        db.add(summary_sr)

        # --- FIX: Update super_overall for the rated department ---
        db.flush()  # Ensure summary_sr is written before calculating average
        update_super_overall_for_department(db, survey.rated_department_id)
        # ---------------------------------------------------------

        db.commit()
        return jsonify({"message": "Survey submitted successfully!"}, 201)
    except IntegrityError:
        db.rollback()
        return jsonify({"detail": "Duplicate submission or database error."}), 400
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Error: {str(e)}"}), 500
    finally:
        db.close()

# --- Get User's Completed Survey Submissions ---
@survey_bp.route('/user-submissions', methods=['GET'])
@paseto_required()
def get_user_submissions():
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify({"detail": "User not found"}), 404
        submissions = db.query(SurveySubmission).filter(
            SurveySubmission.submitter_user_id == user.id,
            SurveySubmission.status != 'Draft'   # Only completed submissions
        ).all()
        return jsonify([
            {
                "id": s.id,
                "survey_id": s.survey_id,
                "rated_department_id": s.rated_department_id,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
            } for s in submissions
        ])
    finally:
        db.close()

# --- Get All Surveys (for admin or selection) ---
@survey_bp.route('/surveys', methods=['GET'])
@paseto_required()
def get_surveys():
    db: Session = SessionLocal()
    try:
        surveys = db.query(Survey).options(
            joinedload(Survey.rated_department),
            joinedload(Survey.managing_department)
        ).all()
        return jsonify([
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "rated_department_id": s.rated_department_id,
                "rated_dept_name": s.rated_department.name if s.rated_department else None,
                "managing_department_id": s.managing_department_id,
                "managing_dept_name": s.managing_department.name if s.managing_department else None,
            }
            for s in surveys
        ])
    finally:
        db.close()

# --- Create Survey ---
@survey_bp.route('/surveys', methods=['POST'])
@paseto_required()
def create_survey():
    db: Session = SessionLocal()
    try:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        rated_department_id = data.get('rated_department_id')
        managing_department_id = data.get('managing_department_id')

        if not (title and rated_department_id):
            return jsonify({"detail": "Title and rated_department_id are required"}), 400

        survey = Survey(
            title=title,
            description=description,
            rated_department_id=rated_department_id,
            managing_department_id=managing_department_id
        )
        db.add(survey)
        db.commit()
        return jsonify({"message": "Survey created", "id": survey.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": str(e)}), 500
    finally:
        db.close()

# --- Populate Surveys from Permissions ---

@survey_bp.route('/populate-surveys-from-permissions', methods=['POST'])
@paseto_required()
def api_populate_surveys_from_permissions():
    try:
        created = populate_surveys_from_permissions()
        return jsonify({"message": f"Populated {created} surveys from permissions."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Save Survey Draft ---
@survey_bp.route('/surveys/<int:survey_id>/save_draft', methods=['POST'])
@paseto_required()
def save_survey_draft(survey_id):
    db: Session = SessionLocal()
    try:
        data = request.get_json()
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify({"detail": "User not found"}), 404

        # Get user's department
        user_dept = db.query(Department).filter(Department.name == user.department).first()
        if not user_dept:
            return jsonify({"detail": "User's department not found."}), 404

        # Find existing draft
        draft = db.query(SurveySubmission).filter(
            SurveySubmission.survey_id == survey_id,
            SurveySubmission.submitter_user_id == user.id,
            SurveySubmission.status == 'Draft'
        ).first()

        if draft:
            # Update existing draft
            draft.suggestions = data.get('suggestion', '')
            draft.submitted_at = datetime.now(timezone.utc)
            # Remove old answers and add new ones
            db.query(Answer).filter(Answer.submission_id == draft.id).delete()
        else:
            # Create new draft
            draft = SurveySubmission(
                survey_id=survey_id,
                submitter_user_id=user.id,
                submitter_department_id=user_dept.id,
                rated_department_id=data.get('rated_department_id'),
                suggestions=data.get('suggestion', ''),
                submitted_at=datetime.now(timezone.utc),
                status='Draft'
            )
            db.add(draft)
            db.flush()

        for answer in data.get('answers', []):
            db.add(Answer(
                submission_id=draft.id,
                question_id=answer['id'],
                rating_value=answer['rating'],
                text_response=answer.get('remarks', '')
            ))

        db.commit()
        return jsonify({"message": "Draft saved successfully!"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Error: {str(e)}"}), 500
    finally:
        db.close()

# --- Get Survey Draft ---
@survey_bp.route('/surveys/<int:survey_id>/draft', methods=['GET'])
@paseto_required()
def get_survey_draft(survey_id):
    db: Session = SessionLocal()
    try:
        username = get_paseto_identity()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return jsonify({"detail": "User not found"}), 404

        draft = db.query(SurveySubmission).filter(
            SurveySubmission.survey_id == survey_id,
            SurveySubmission.submitter_user_id == user.id,
            SurveySubmission.status == 'Draft'
        ).first()

        if not draft:
            return jsonify({}), 200

        answers = db.query(Answer).filter(Answer.submission_id == draft.id).all()
        answers_data = [
            {
                "id": a.question_id,
                "rating": a.rating_value,
                "remarks": a.text_response or ""
            }
            for a in answers
        ]
        return jsonify({
            "answers": answers_data,
            "finalSuggestion": draft.suggestions or ""
        }), 200
    finally:
        db.close()

# --- Populate Question Options ---
@survey_bp.route('/populate-question-options', methods=['POST'])
@paseto_required()
def api_populate_question_options():
    try:
        created = populate_question_options_for_ratings()
        return jsonify({"message": f"Populated options for {created} rating questions."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Populate Questions for Surveys ---
@survey_bp.route('/populate-questions-for-surveys', methods=['POST'])
@paseto_required()
def api_populate_questions_for_surveys():
    try:
        created = populate_questions_for_all_surveys()
        return jsonify({"message": f"Populated questions for {created} surveys."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from sqlalchemy.orm import Session
from backend.models import SurveyResponse

def update_super_overall_for_department(db: Session, department_id: int):
    # Calculate the average overall_rating for this department
    avg = db.query(func.avg(SurveyResponse.overall_rating))\
        .filter(SurveyResponse.to_department_id == department_id, SurveyResponse.overall_rating != None)\
        .scalar()
    # Update all survey_responses for this department with the new super_overall
    db.query(SurveyResponse)\
        .filter(SurveyResponse.to_department_id == department_id)\
        .update({SurveyResponse.super_overall: avg}, synchronize_session=False)
    db.commit()
