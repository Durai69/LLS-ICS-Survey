from backend.database import SessionLocal
from backend.models import SurveySubmission, SurveyResponse, Department, User
from sqlalchemy import or_
from datetime import datetime

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
                acknowledged=False
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