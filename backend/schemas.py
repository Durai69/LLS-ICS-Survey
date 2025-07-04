# backend/schemas.py
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from enum import Enum as PyEnum

# Enum for Question Type, mirroring the SQLAlchemy Enum
class QuestionTypeEnum(str, PyEnum):
    RATING = "rating"
    TEXT = "text"
    MULTIPLE_CHOICE = "multiple_choice"

# --- Authentication & User Schemas ---
class UserLoginSchema(BaseModel):
    username: str
    password: str

class UserSchema(BaseModel):
    id: int
    username: str
    name: str
    email: EmailStr
    department: str
    role: str
    is_active: bool
    created_at: datetime # This will be datetime object from model

    class Config:
        from_attributes = True # Allow population from ORM models

# --- Department Schemas ---
class DepartmentSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# --- Permission Schemas ---
class PermissionCreateUpdatePayload(BaseModel):
    from_dept_id: int
    to_dept_id: int
    can_survey_self: bool = False

class SavePermissionsRequest(BaseModel):
    allowed_pairs: List[PermissionCreateUpdatePayload]
    start_date: date # Will be parsed from ISO string
    end_date: date   # Will be parsed from ISO string

class PermissionResponse(BaseModel):
    from_department_id: int
    to_department_id: int
    can_survey_self: bool
    start_date: date
    end_date: date

    class Config:
        from_attributes = True

# --- Survey Schemas ---
class OptionSchema(BaseModel):
    id: int
    text: str
    value: int
    order: int

    class Config:
        from_attributes = True

class QuestionSchema(BaseModel):
    id: int
    survey_id: int
    category: Optional[str] = None
    text: str
    type: QuestionTypeEnum # Use the Pydantic Enum
    order: int
    options: List[OptionSchema] = [] # For multiple choice questions

    class Config:
        from_attributes = True

class SurveyBaseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    managing_department_id: Optional[int] = None
    rated_department_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SurveyWithQuestionsSchema(SurveyBaseSchema):
    questions: List[QuestionSchema] = []

class SurveyAvailableForUserSchema(BaseModel):
    # This is a simplified schema for the DepartmentSelection.tsx to consume
    id: int # This is the survey ID
    title: str
    description: Optional[str] = None
    rated_dept_name: str # For display in frontend
    rated_department_id: int

    class Config:
        from_attributes = True

# --- Survey Submission Schemas ---

class AnswerPayload(BaseModel):
    id: int # This is the question ID
    rating: Optional[int] = None # For rating questions
    remarks: Optional[str] = None # For text questions or remarks on rating questions
    selected_option_id: Optional[int] = None # For multiple_choice questions

class SurveySubmissionPayload(BaseModel):
    # user_id will be extracted from JWT
    # submitter_department_id will be extracted from JWT
    answers: List[AnswerPayload]
    suggestion: Optional[str] = None # Overall suggestion
    overall_customer_rating: Optional[float] = None # Calculated on backend
    rating_description: Optional[str] = None # Optional description for overall rating

class UserSubmissionStatusSchema(BaseModel):
    # For DepartmentSelection to show if a survey has been taken
    survey_id: int
    rated_department_id: int
    submitted_at: datetime
    overall_customer_rating: Optional[float] = None

    class Config:
        from_attributes = True