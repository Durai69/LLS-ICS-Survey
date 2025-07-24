# F:\LLS Survey\backend\models.py

from backend.database import Base
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, UniqueConstraint, Text, Enum, Float, Boolean
from sqlalchemy.orm import relationship

# --- User Model ---
class User(Base):
    __tablename__ = "admin_users"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default='user')
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)
    department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=True)

    survey_submissions_made = relationship("SurveySubmission", back_populates="submitter")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', name='{self.name}')>"

# --- Department Model ---
class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    surveys_managed = relationship("Survey", foreign_keys='Survey.managing_department_id', back_populates="managing_department")
    permissions_from = relationship("Permission", foreign_keys='Permission.from_dept_id', back_populates="from_department")
    permissions_to = relationship("Permission", foreign_keys='Permission.to_dept_id', back_populates="to_department")

    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"

# --- Permission Model ---
class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint('from_dept_id', 'to_dept_id', name='uq_from_to_dept'),
        {'schema': 'dbo'}
    )

    id = Column(Integer, primary_key=True, index=True)
    from_dept_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    to_dept_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    can_survey_self = Column(Boolean, default=False, nullable=False)

    from_department = relationship("Department", foreign_keys=[from_dept_id], back_populates="permissions_from")
    to_department = relationship("Department", foreign_keys=[to_dept_id], back_populates="permissions_to")

    def __repr__(self):
        return f"<Permission(id={self.id}, from_dept_id={self.from_dept_id}, to_dept_id={self.to_dept_id})>"

# --- Survey Model ---
class Survey(Base):
    __tablename__ = "surveys"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    rated_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    rated_department = relationship("Department", foreign_keys=[rated_department_id])
    managing_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=True)
    managing_department = relationship("Department", foreign_keys=[managing_department_id], back_populates="surveys_managed")

    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan", order_by="Question.order")
    submissions = relationship("SurveySubmission", back_populates="survey", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Survey(id={self.id}, title='{self.title}', rated_dept_id={self.rated_department_id})>"

# --- Question Model ---
class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (UniqueConstraint('survey_id', 'order', name='uq_survey_question_order'),
                      {'schema': 'dbo'})

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey('dbo.surveys.id'), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(Enum('rating', 'text', 'multiple_choice', name='question_type'), nullable=False)
    order = Column(Integer, nullable=False)
    category = Column(String, nullable=True)

    survey = relationship("Survey", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan", order_by="Option.order")
    answers = relationship("Answer", back_populates="question")

    def __repr__(self):
        return f"<Question(id={self.id}, survey_id={self.survey_id}, order={self.order}, type='{self.type}')>"

# --- Option Model ---
class Option(Base):
    __tablename__ = "question_options"
    __table_args__ = (UniqueConstraint('question_id', 'order', name='uq_question_option_order'),
                      {'schema': 'dbo'})

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    text = Column(String, nullable=False)
    value = Column(String, nullable=True)
    order = Column(Integer, nullable=False, default=0)

    question = relationship("Question", back_populates="options")
    answers_chosen = relationship("Answer", foreign_keys='Answer.selected_option_id', back_populates="selected_option")

    def __repr__(self):
        return f"<Option(id={self.id}, question_id={self.question_id}, text='{self.text}')>"

# --- Survey Submission Model ---
class SurveySubmission(Base):
    __tablename__ = "survey_submissions"
    __table_args__ = (UniqueConstraint('survey_id', 'submitter_user_id', name='uq_user_survey_submission'),
                      {'schema': 'dbo'})

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey('dbo.surveys.id'), nullable=False)
    submitter_user_id = Column(Integer, ForeignKey('dbo.admin_users.id'), nullable=False)
    submitted_at = Column(DateTime, server_default=func.now())
    submitter_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    submitter_department = relationship("Department", foreign_keys=[submitter_department_id])
    rated_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    rated_department = relationship("Department", foreign_keys=[rated_department_id])
    overall_customer_rating = Column(Float, nullable=True)
    rating_description = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    answers_by_category = Column(Text, nullable=True)
    survey_attendance = Column(Float, nullable=True)  # New column for survey attendance percentage
    survey = relationship("Survey", back_populates="submissions")
    submitter = relationship("User", back_populates="survey_submissions_made")
    answers = relationship(
        "Answer",
        back_populates="submission",
        cascade="all, delete-orphan",
        foreign_keys="Answer.submission_id"
    )
    status = Column(String(32), default='Submitted')

    def __repr__(self):
        return f"<SurveySubmission(id={self.id}, survey_id={self.survey_id}, submitter_user_id={self.submitter_user_id})>"

# --- Answer Model ---
class Answer(Base):
    __tablename__ = "survey_answers"
    __table_args__ = (UniqueConstraint('submission_id', 'question_id', name='uq_submission_question_answer'),
                      {'schema': 'dbo'})

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey('dbo.survey_submissions.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    rating_value = Column(Integer, nullable=True)
    text_response = Column(Text, nullable=True)
    selected_option_id = Column(Integer, ForeignKey('dbo.question_options.id'), nullable=True)

    submission = relationship(
        "SurveySubmission",
        back_populates="answers",
        foreign_keys=[submission_id]
    )
    question = relationship("Question", back_populates="answers")
    selected_option = relationship("Option", back_populates="answers_chosen")

    def __repr__(self):
        return f"<Answer(id={self.id}, submission_id={self.submission_id}, question_id={self.question_id})>"

# --- Period Model ---
class Period(Base):
    __tablename__ = "periods"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Period(id={self.id}, name='{self.name}', start_date={self.start_date}, end_date={self.end_date})>"

# --- SurveyResponse Model ---
class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    survey_submission_id = Column(Integer, ForeignKey('dbo.survey_submissions.id'), nullable=True)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=True)
    submitted_at = Column(DateTime)
    final_suggestion = Column(Text)
    from_department_id = Column(Integer, ForeignKey('dbo.departments.id'))
    to_department_id = Column(Integer, ForeignKey('dbo.departments.id'))
    rating = Column(Integer)
    remark = Column(Text)
    explanation = Column(Text)
    action_plan = Column(Text)
    responsible_person = Column(String(255))
    acknowledged = Column(Boolean, default=False)
    updated_at = Column(DateTime)
    responded_at = Column(DateTime, server_default=func.now(), nullable=True)
    target_date = Column(DateTime, nullable=True)
    overall_rating = Column(Float, nullable=True)
    super_overall = Column(Float, nullable=True)

    # Optional: Add relationships for easier access
    from_department = relationship("Department", foreign_keys=[from_department_id])
    to_department = relationship("Department", foreign_keys=[to_department_id])

    def __repr__(self):
        return f"<SurveyResponse(id={self.id}, survey_id={self.survey_id}, user_id={self.user_id})>"
