from backend.database import SessionLocal
from backend.models import SurveySubmission, SurveyResponse, Department, User, Answer, Question
from sqlalchemy import or_
from datetime import datetime
from collections import defaultdict

def calculate_overall_rating(db, submission_id):
    # Map for category short names
    category_map = {
        'Q': 'Quality',
        'D': 'Delivery',
        'C': 'Communication',
        'R': 'Responsiveness',
        'I': 'Improvement'
    }

    # Get all answers for this submission, joined with question category
    answers = (
        db.query(Answer.rating_value, Question.category)
        .join(Question, Answer.question_id == Question.id)
        .filter(Answer.submission_id == submission_id)
        .all()
    )

    # Group answers by category
    cat_scores = defaultdict(list)
    for rating, cat in answers:
        if cat and rating is not None:
            cat_short = cat[0].upper()  # e.g., 'Q', 'D', etc.
            if cat_short in category_map:
                cat_scores[cat_short].append(rating)

    # Calculate average for each category (must have 4 ratings per category)
    avgs = []
    for cat in ['Q', 'D', 'C', 'R', 'I']:
        ratings = cat_scores.get(cat, [])
        if len(ratings) == 4:
            avgs.append(sum(ratings) / 4)
        else:
            # If any category is missing ratings, cannot compute overall
            return None

    # Compute overall rating
    overall = (sum(avgs) / 5) * 25
    return overall

def main():
    db = SessionLocal()
    try:
        # Find all submissions with low rating and a remark
        submissions = db.query(SurveySubmission).filter(
            SurveySubmission.overall_customer_rating.in_([1, 2]),
            SurveySubmission.rating_description != None,
            SurveySubmission.rating_description != ''
        ).all()

        for sub in submissions:
            # Check if already exists to avoid duplicates
            exists = db.query(SurveyResponse).filter(
                SurveyResponse.survey_submission_id == sub.id
            ).first()
            if exists:
                continue

            # Try to get user_id from submitter_user_id
            user_id = sub.submitter_user_id

            # Use submitter and rated department for from/to
            sr = SurveyResponse(
                survey_id=sub.survey_id,
                user_id=user_id,
                survey_submission_id=sub.id,
                from_department_id=sub.submitter_department_id,
                to_department_id=sub.rated_department_id,
                rating=sub.overall_customer_rating,
                remark=sub.rating_description,
                explanation=None,
                action_plan=None,
                responsible_person=None,
                submitted_at=sub.submitted_at,
                responded_at=None,
                acknowledged=False,
                overall_rating=calculate_overall_rating(db, sub.id)  # <-- Add this line
            )
            db.add(sr)
        db.commit()
        print("SurveyResponse table populated from real submissions.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()