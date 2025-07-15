from flask import Blueprint, request, send_file, jsonify, g
from sqlalchemy.orm import Session
import pandas as pd
import io
import datetime
from ..models import SurveyResponse, Department, User, Question  # Added Question for question text
from ..database import SessionLocal
from backend.utils.paseto_utils import paseto_required, get_paseto_identity

excel_bp = Blueprint('excel', __name__)

def filter_responses_by_time_period(responses, time_period):
    if not time_period:
        return responses
    filtered = []
    try:
        parts = time_period.split()
        years = parts[0].split('-')
        start_year = int(years[0])
        end_year = int(years[1])
        survey_part = parts[1] if len(parts) > 1 else None

        for resp in responses:
            if not resp.submitted_at:
                continue
            year = resp.submitted_at.year
            if year < start_year or year > end_year:
                continue
            if survey_part:
                month = resp.submitted_at.month
                if survey_part == '1st' and month > 6:
                    continue
                if survey_part == '2nd' and month <= 6:
                    continue
            filtered.append(resp)
    except Exception:
        filtered = responses
    return filtered

@excel_bp.route('/api/export', methods=['GET'])
@paseto_required()
def export_excel():
    export_type = request.args.get('type')
    time_period = request.args.get('timePeriod')

    db: Session = SessionLocal()
    current_username = get_paseto_identity()
    user = db.query(User).filter(User.username == current_username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='openpyxl')

    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("excel_export")

    logger.info(f"Export type: {export_type}, Time period: {time_period}")

    if export_type == 'My Submitted Surveys':
        responses = db.query(SurveyResponse).filter(SurveyResponse.user_id == user.id).all()
        logger.info(f"Total responses before filtering: {len(responses)}")
        responses = filter_responses_by_time_period(responses, time_period)
        logger.info(f"Total responses after filtering: {len(responses)}")
        df_data = []
        for resp in responses:
            dept = db.query(Department).filter(Department.id == resp.to_department_id).first()
            question = db.query(Question).filter(Question.id == resp.question_id).first()
            df_data.append({
                "Survey ID": resp.survey_id,
                "Department": dept.name if dept else "",
                "Date of Submission": resp.submitted_at.strftime('%Y-%m-%d') if resp.submitted_at else "",
                "Category": getattr(resp, 'category', 'General'),
                "Question": question.text if question else "",
                "Rating": resp.rating if resp.rating is not None else "",
                "Remark": resp.remark if resp.remark else "",
                "Suggestions/Comments": resp.final_suggestion if hasattr(resp, 'final_suggestion') else "",
                "User": user.username,
                "User Department": dept.name if dept else ""
            })
        df = pd.DataFrame(df_data)
        df.to_excel(writer, sheet_name='My Submitted Surveys', index=False)
        filename_base = "my_submitted_surveys"

    elif export_type == 'My Submitted Action Plans':
        responses = db.query(SurveyResponse).filter(SurveyResponse.user_id == user.id).all()
        logger.info(f"Total responses before filtering: {len(responses)}")
        responses = filter_responses_by_time_period(responses, time_period)
        logger.info(f"Total responses after filtering: {len(responses)}")
        df_data = []
        for resp in responses:
            from_dept = db.query(Department).filter(Department.id == resp.from_department_id).first()
            to_dept = db.query(Department).filter(Department.id == resp.to_department_id).first()
            question = db.query(Question).filter(Question.id == resp.question_id).first()
            category = question.category if question and question.category else ""
            acknowledged_str = "Acknowledged" if resp.acknowledged else "Not Acknowledged"
            df_data.append({
                # "Rated By": user.username,  # Removed as requested
                "From Department": from_dept.name if from_dept else "",
                "To Department": to_dept.name if to_dept else "",
                "Rating Value": resp.rating if resp.rating is not None else "",
                "Category": category,
                "Explanation": resp.explanation if resp.explanation else "",
                "Action Plan": resp.action_plan if resp.action_plan else "",
                "Responsible Person": resp.responsible_person if resp.responsible_person else "",
                "Target Date": resp.target_date.strftime('%Y-%m-%d') if resp.target_date else "",
                "Acknowledged": acknowledged_str
            })
        df = pd.DataFrame(df_data)
        df.to_excel(writer, sheet_name='My Submitted Action Plans', index=False)
        filename_base = "my_submitted_action_plans"

    else:
        writer.close()
        return jsonify({"error": "Unknown export type"}), 400

    writer.close()
    output.seek(0)
    current_date_str = datetime.date.today().strftime('%Y%m%d')
    final_filename = f"{filename_base}_{current_date_str}.xlsx"

    return send_file(output,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     as_attachment=True,
                     download_name=final_filename)

@excel_bp.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    from_dept = request.args.get('fromDept')
    to_dept = request.args.get('toDept')
    time_period = request.args.get('timePeriod')

    db: Session = SessionLocal()
    query = db.query(SurveyResponse)
    if from_dept:
        from_dept_obj = db.query(Department).filter(Department.name == from_dept).first()
        if from_dept_obj:
            query = query.filter(SurveyResponse.from_department_id == from_dept_obj.id)
    if to_dept:
        to_dept_obj = db.query(Department).filter(Department.name == to_dept).first()
        if to_dept_obj:
            query = query.filter(SurveyResponse.to_department_id == to_dept_obj.id)
    responses = query.all()
    responses = filter_responses_by_time_period(responses, time_period)
    result = []
    for resp in responses:
        from_dept_obj = db.query(Department).filter(Department.id == resp.from_department_id).first()
        to_dept_obj = db.query(Department).filter(Department.id == resp.to_department_id).first()
        # Calculate avgRating if you want (for now, use resp.rating)
        result.append({
            "id": resp.id,
            "from_department": from_dept_obj.name if from_dept_obj else "",
            "to_department": to_dept_obj.name if to_dept_obj else "",
            "date": resp.submitted_at.strftime('%Y-%m-%d') if resp.submitted_at else "",
            "remark": resp.remark if resp.remark else "",
        })
    return jsonify(result)

@excel_bp.route('/api/admin/reports/export', methods=['GET'])
def export_admin_reports_excel():
    from_dept = request.args.get('fromDept')
    to_dept = request.args.get('toDept')
    time_period = request.args.get('timePeriod')

    db: Session = SessionLocal()
    query = db.query(SurveyResponse)
    if from_dept:
        from_dept_obj = db.query(Department).filter(Department.name == from_dept).first()
        if from_dept_obj:
            query = query.filter(SurveyResponse.from_department_id == from_dept_obj.id)
    if to_dept:
        to_dept_obj = db.query(Department).filter(Department.name == to_dept).first()
        if to_dept_obj:
            query = query.filter(SurveyResponse.to_department_id == to_dept_obj.id)
    responses = query.all()
    responses = filter_responses_by_time_period(responses, time_period)

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='openpyxl')
    df_data = []
    for resp in responses:
        from_dept_obj = db.query(Department).filter(Department.id == resp.from_department_id).first()
        to_dept_obj = db.query(Department).filter(Department.id == resp.to_department_id).first()
        df_data.append({
            "From Department": from_dept_obj.name if from_dept_obj else "",
            "To Department": to_dept_obj.name if to_dept_obj else "",
            "Date": resp.submitted_at.strftime('%Y-%m-%d') if resp.submitted_at else "",
        })
    df = pd.DataFrame(df_data)
    df.to_excel(writer, sheet_name='Survey Reports', index=False)
    writer.close()
    output.seek(0)
    current_date_str = datetime.date.today().strftime('%Y%m%d')
    final_filename = f"admin_survey_reports_{current_date_str}.xlsx"
    return send_file(output,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     as_attachment=True,
                     download_name=final_filename)
