# F:\LLS Survey\backend\models.py

from backend.database import Base
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, UniqueConstraint, Text, Enum, Float, Boolean
from sqlalchemy.orm import relationship

# Existing User Model (Consolidated)
class User(Base):
    __tablename__ = "admin_users" # Ensure this matches your actual table name
    __table_args__ = {'schema': 'dbo'} # Ensure this matches your actual schema

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String) # This is the department NAME, not an ID.
    hashed_password = Column(String, nullable=False)
    role = Column(String, default='user')  # Either 'admin', 'user', 'manager', 'rep', etc.
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationship to SurveySubmission - a user can make many submissions
    # This maps 'submitter' in SurveySubmission to a User
    survey_submissions_made = relationship("SurveySubmission", back_populates="submitter")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', name='{self.name}')>"

# Existing Department Model
class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship to surveys - a department can have many surveys *for which it is responsible*
    # This assumes a survey is "owned" or "managed" by one department.
    # FIX: Explicitly tell SQLAlchemy which foreign key to use for this relationship
    surveys_managed = relationship("Survey", foreign_keys='Survey.managing_department_id', back_populates="managing_department")
    
    # Relationship for permissions
    permissions_from = relationship("Permission", foreign_keys='Permission.from_dept_id', back_populates="from_department")
    permissions_to = relationship("Permission", foreign_keys='Permission.to_dept_id', back_populates="to_department")


    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"

# Existing Permission Model
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

    # ADD THESE FIELDS:
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    can_survey_self = Column(Boolean, default=False, nullable=False)

    from_department = relationship("Department", foreign_keys=[from_dept_id], back_populates="permissions_from")
    to_department = relationship("Department", foreign_keys=[to_dept_id], back_populates="permissions_to")

    def __repr__(self):
        return f"<Permission(id={self.id}, from_dept_id={self.from_dept_id}, to_dept_id={self.to_dept_id})>"

# --- Core Survey Models ---

class Survey(Base):
    """
    Represents a definable survey (template).
    A survey is "about" a department (the rated_department)
    and can be created/managed by another department.
    """
    __tablename__ = "surveys"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Department that this survey is designed to rate/evaluate (e.g., "IT Support Survey")
    rated_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    rated_department = relationship("Department", foreign_keys=[rated_department_id])

    # Department that 'manages' or 'assigns' this survey (e.g., "Admin Survey Team")
    managing_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=True) 
    managing_department = relationship("Department", foreign_keys=[managing_department_id], back_populates="surveys_managed")


    # Relationships for structure:
    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan", order_by="Question.order")
    submissions = relationship("SurveySubmission", back_populates="survey", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Survey(id={self.id}, title='{self.title}', rated_dept_id={self.rated_department_id})>"


class Question(Base):
    """
    Represents a question within a Survey.
    """
    __tablename__ = "questions"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey('dbo.surveys.id'), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(Enum('rating', 'text', 'multiple_choice', name='question_type'), nullable=False)
    order = Column(Integer, nullable=False)
    # Removed category column because it does not exist in the database schema
    category = Column(String, nullable=True)

    survey = relationship("Survey", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan", order_by="Option.order")
    answers = relationship("Answer", back_populates="question")

    __table_args__ = (UniqueConstraint('survey_id', 'order', name='uq_survey_question_order'),
                      {'schema': 'dbo'})

    def __repr__(self):
        return f"<Question(id={self.id}, survey_id={self.survey_id}, order={self.order}, type='{self.type}')>"


class Option(Base):
    """
    Represents an option for a multiple_choice Question.
    """
    __tablename__ = "question_options"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    text = Column(String, nullable=False)
    value = Column(String, nullable=True)
    order = Column(Integer, nullable=False, default=0)

    question = relationship("Question", back_populates="options")
    answers_chosen = relationship("Answer", foreign_keys='Answer.selected_option_id', back_populates="selected_option")

    __table_args__ = (UniqueConstraint('question_id', 'order', name='uq_question_option_order'),
                      {'schema': 'dbo'})

    def __repr__(self):
        return f"<Option(id={self.id}, question_id={self.question_id}, text='{self.text}')>"


# --- Survey Submission Models ---

class SurveySubmission(Base):
    """
    Represents a completed instance of a Survey by a User.
    """
    __tablename__ = "survey_submissions"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey('dbo.surveys.id'), nullable=False)
    submitter_user_id = Column(Integer, ForeignKey('dbo.admin_users.id'), nullable=False)
    submitted_at = Column(DateTime, server_default=func.now())

    # The department that SUBMITTED the survey
    submitter_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    submitter_department = relationship("Department", foreign_keys=[submitter_department_id])

    # The department that was RATED by this survey
    rated_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    rated_department = relationship("Department", foreign_keys=[rated_department_id])

    # Overall summary fields from the survey form
    overall_customer_rating = Column(Float, nullable=True)
    rating_description = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)

    # New column to store answers grouped by category as JSON string
    answers_by_category = Column(Text, nullable=True)

    # Relationships
    survey = relationship("Survey", back_populates="submissions")
    submitter = relationship("User", back_populates="survey_submissions_made")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")
    remark_responses = relationship("RemarkResponse", back_populates="survey_submission", cascade="all, delete-orphan")

    # Prevent duplicate submissions by the same user for the same survey
    __table_args__ = (UniqueConstraint('survey_id', 'submitter_user_id', name='uq_user_survey_submission'),
                      {'schema': 'dbo'})

    def __repr__(self):
        return f"<SurveySubmission(id={self.id}, survey_id={self.survey_id}, submitter_user_id={self.submitter_user_id})>"


class Answer(Base):
    """
    Represents a single answer to a specific Question within a SurveySubmission.
    """
    __tablename__ = "survey_answers"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey('dbo.survey_submissions.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    
    # Answer values based on question type
    rating_value = Column(Integer, nullable=True)
    text_response = Column(Text, nullable=True)
    selected_option_id = Column(Integer, ForeignKey('dbo.question_options.id'), nullable=True)

    submission = relationship("SurveySubmission", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    selected_option = relationship("Option", back_populates="answers_chosen")

    # Prevent duplicate answers for the same question within a submission
    __table_args__ = (UniqueConstraint('submission_id', 'question_id', name='uq_submission_question_answer'),
                      {'schema': 'dbo'})

    def __repr__(self):
        return f"<Answer(id={self.id}, submission_id={self.submission_id}, question_id={self.question_id})>"


class RemarkResponse(Base):
    """
    Stores responses given by a department to specific remarks made in a survey.
    """
    __tablename__ = "remark_responses"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    survey_submission_id = Column(Integer, ForeignKey('dbo.survey_submissions.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    
    explanation = Column(Text, nullable=False)
    action_plan = Column(Text, nullable=False)
    responsible_person = Column(String, nullable=False)
    responded_at = Column(DateTime, server_default=func.now())
    
    # The department that provided this response (the rated department)
    responded_by_department_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    responded_by_department = relationship("Department", foreign_keys=[responded_by_department_id])

    survey_submission = relationship("SurveySubmission", back_populates="remark_responses")
    remarked_question = relationship("Question") # Link to the question this response is for

    # A single response per remark per submission
    __table_args__ = (UniqueConstraint('survey_submission_id', 'question_id', name='uq_remark_response_per_question'),
                      {'schema': 'dbo'})

    def __repr__(self):
        return f"<RemarkResponse(id={self.id}, submission_id={self.survey_submission_id}, question_id={self.question_id})>"

class Period(Base):
    __tablename__ = "periods"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Period(id={self.id}, name='{self.name}', start_date={self.start_date}, end_date={self.end_date})>"
