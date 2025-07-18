from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKeyConstraint, Identity, Index, Integer, PrimaryKeyConstraint, String, TEXT, Unicode, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime

class Base(DeclarativeBase):
    pass


class AdminUsers(Base):
    __tablename__ = 'admin_users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__admin_us__3213E83F09079C8F'),
        Index('UQ__admin_us__F3DBC572AC3F5ED5', 'username', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    username: Mapped[str] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    hashed_password: Mapped[str] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text('((1))'))
    role: Mapped[Optional[str]] = mapped_column(Unicode(50, 'SQL_Latin1_General_CP1_CI_AS'), server_default=text("('admin')"))
    name: Mapped[Optional[str]] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    email: Mapped[Optional[str]] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    department: Mapped[Optional[str]] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))
    department_id: Mapped[Optional[int]] = mapped_column(Integer)

    survey_submissions: Mapped[List['SurveySubmissions']] = relationship('SurveySubmissions', back_populates='submitter_user')
    survey_responses: Mapped[List['SurveyResponses']] = relationship('SurveyResponses', back_populates='user')


class Departments(Base):
    __tablename__ = 'departments'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__departme__3213E83F8C395963'),
        Index('ix_dbo_departments_id', 'id'),
        Index('ix_dbo_departments_name', 'name', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    name: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    permissions: Mapped[List['Permissions']] = relationship('Permissions', foreign_keys='[Permissions.from_dept_id]', back_populates='from_dept')
    permissions_: Mapped[List['Permissions']] = relationship('Permissions', foreign_keys='[Permissions.to_dept_id]', back_populates='to_dept')
    survey_submissions: Mapped[List['SurveySubmissions']] = relationship('SurveySubmissions', foreign_keys='[SurveySubmissions.rated_department_id]', back_populates='rated_department')
    survey_submissions_: Mapped[List['SurveySubmissions']] = relationship('SurveySubmissions', foreign_keys='[SurveySubmissions.submitter_department_id]', back_populates='submitter_department')
    survey_responses: Mapped[List['SurveyResponses']] = relationship('SurveyResponses', foreign_keys='[SurveyResponses.from_department_id]', back_populates='from_department')
    survey_responses_: Mapped[List['SurveyResponses']] = relationship('SurveyResponses', foreign_keys='[SurveyResponses.to_department_id]', back_populates='to_department')


class Login(Base):
    __tablename__ = 'login'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__login__3213E83FD856A11A'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    username: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    hashvalue: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))


class Periods(Base):
    __tablename__ = 'periods'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__periods__3213E83FE727D9B9'),
        Index('ix_dbo_periods_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    name: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    start_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    end_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)


class Surveys(Base):
    __tablename__ = 'surveys'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__surveys__3213E83F3365E082'),
        Index('ix_dbo_surveys_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    title: Mapped[str] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    dept_name: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'), server_default=text("('DefaultDept')"))
    internal_supplier: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'), server_default=text("('DefaultSupplier')"))
    date: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('(getdate())'))
    description: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))
    overall_customer_rating: Mapped[Optional[float]] = mapped_column(Float(53))
    rating_description: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    suggestions: Mapped[Optional[str]] = mapped_column(TEXT(2147483647, 'SQL_Latin1_General_CP1_CI_AS'))
    rated_department_id: Mapped[Optional[int]] = mapped_column(Integer)
    managing_department_id: Mapped[Optional[int]] = mapped_column(Integer)

    communication_ratings: Mapped[List['CommunicationRatings']] = relationship('CommunicationRatings', back_populates='survey')
    delivery_ratings: Mapped[List['DeliveryRatings']] = relationship('DeliveryRatings', back_populates='survey')
    improvement_ratings: Mapped[List['ImprovementRatings']] = relationship('ImprovementRatings', back_populates='survey')
    quality_ratings: Mapped[List['QualityRatings']] = relationship('QualityRatings', back_populates='survey')
    questions: Mapped[List['Questions']] = relationship('Questions', back_populates='survey')
    responsiveness_ratings: Mapped[List['ResponsivenessRatings']] = relationship('ResponsivenessRatings', back_populates='survey')
    survey_submissions: Mapped[List['SurveySubmissions']] = relationship('SurveySubmissions', back_populates='survey')
    survey_responses: Mapped[List['SurveyResponses']] = relationship('SurveyResponses', back_populates='survey')


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__users__3213E83F52F21D11'),
        Index('UQ__users__F3DBC572A60E2B3A', 'username', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    username: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    hashed_password: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    name: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    email: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    department: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    role: Mapped[Optional[str]] = mapped_column(String(100, 'SQL_Latin1_General_CP1_CI_AS'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))


class CommunicationRatings(Base):
    __tablename__ = 'communication_ratings'
    __table_args__ = (
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__communica__surve__7B264821'),
        PrimaryKeyConstraint('id', name='PK__communic__3213E83F1BBAE46B'),
        Index('ix_dbo_communication_ratings_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    average: Mapped[float] = mapped_column(Float(53))
    communication_interacts_regularly: Mapped[Optional[int]] = mapped_column(Integer)
    communication_listens_views: Mapped[Optional[int]] = mapped_column(Integer)
    communication_timely_feedback: Mapped[Optional[int]] = mapped_column(Integer)
    communication_reviews_changes: Mapped[Optional[int]] = mapped_column(Integer)
    understand_needs: Mapped[Optional[int]] = mapped_column(Integer)
    metric2: Mapped[Optional[int]] = mapped_column(Integer)
    metric3: Mapped[Optional[int]] = mapped_column(Integer)
    metric4: Mapped[Optional[int]] = mapped_column(Integer)
    reason: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))

    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='communication_ratings')


class DeliveryRatings(Base):
    __tablename__ = 'delivery_ratings'
    __table_args__ = (
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__delivery___surve__7849DB76'),
        PrimaryKeyConstraint('id', name='PK__delivery__3213E83FEF7616B0'),
        Index('ix_dbo_delivery_ratings_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    average: Mapped[float] = mapped_column(Float(53))
    delivery_fulfill_targets: Mapped[Optional[int]] = mapped_column(Integer)
    delivery_promptly_on_time: Mapped[Optional[int]] = mapped_column(Integer)
    delivery_point_of_use: Mapped[Optional[int]] = mapped_column(Integer)
    delivery_usable_parts: Mapped[Optional[int]] = mapped_column(Integer)
    understand_needs: Mapped[Optional[int]] = mapped_column(Integer)
    metric2: Mapped[Optional[int]] = mapped_column(Integer)
    metric3: Mapped[Optional[int]] = mapped_column(Integer)
    metric4: Mapped[Optional[int]] = mapped_column(Integer)
    reason: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))

    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='delivery_ratings')


class ImprovementRatings(Base):
    __tablename__ = 'improvement_ratings'
    __table_args__ = (
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__improveme__surve__00DF2177'),
        PrimaryKeyConstraint('id', name='PK__improvem__3213E83F3B4F897B'),
        Index('ix_dbo_improvement_ratings_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    average: Mapped[float] = mapped_column(Float(53))
    improvement_positive_attitude: Mapped[Optional[int]] = mapped_column(Integer)
    improvement_implements_improvement: Mapped[Optional[int]] = mapped_column(Integer)
    improvement_effectiveness: Mapped[Optional[int]] = mapped_column(Integer)
    improvement_facilitates_customer_end: Mapped[Optional[int]] = mapped_column(Integer)
    understand_needs: Mapped[Optional[int]] = mapped_column(Integer)
    metric2: Mapped[Optional[int]] = mapped_column(Integer)
    metric3: Mapped[Optional[int]] = mapped_column(Integer)
    metric4: Mapped[Optional[int]] = mapped_column(Integer)
    reason: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))

    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='improvement_ratings')


class Permissions(Base):
    __tablename__ = 'permissions'
    __table_args__ = (
        ForeignKeyConstraint(['from_dept_id'], ['dbo.departments.id'], name='FK__permissio__from___540C7B00'),
        ForeignKeyConstraint(['to_dept_id'], ['dbo.departments.id'], name='FK__permissio__to_de__55009F39'),
        PrimaryKeyConstraint('id', name='PK__permissi__3213E83F4C341AE2'),
        Index('ix_dbo_permissions_id', 'id'),
        Index('uq_from_to_dept', 'from_dept_id', 'to_dept_id', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    from_dept_id: Mapped[int] = mapped_column(Integer)
    to_dept_id: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('(getdate())'))
    end_date: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('(getdate())'))
    can_survey_self: Mapped[bool] = mapped_column(Boolean, server_default=text('((0))'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    from_dept: Mapped['Departments'] = relationship('Departments', foreign_keys=[from_dept_id], back_populates='permissions')
    to_dept: Mapped['Departments'] = relationship('Departments', foreign_keys=[to_dept_id], back_populates='permissions_')


class QualityRatings(Base):
    __tablename__ = 'quality_ratings'
    __table_args__ = (
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__quality_r__surve__756D6ECB'),
        PrimaryKeyConstraint('id', name='PK__quality___3213E83F0A5F8156'),
        Index('ix_dbo_quality_ratings_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    average: Mapped[float] = mapped_column(Float(53))
    quality_understand_needs: Mapped[Optional[int]] = mapped_column(Integer)
    quality_100_percent_parts: Mapped[Optional[int]] = mapped_column(Integer)
    quality_accepts_responsibility: Mapped[Optional[int]] = mapped_column(Integer)
    quality_eliminates_complaints: Mapped[Optional[int]] = mapped_column(Integer)
    metric2: Mapped[Optional[int]] = mapped_column(Integer)
    metric3: Mapped[Optional[int]] = mapped_column(Integer)
    metric4: Mapped[Optional[int]] = mapped_column(Integer)
    reason: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))

    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='quality_ratings')


class Questions(Base):
    __tablename__ = 'questions'
    __table_args__ = (
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__questions__surve__65370702'),
        PrimaryKeyConstraint('id', name='PK__question__3213E83F5E124C58'),
        Index('ix_dbo_questions_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    text_: Mapped[str] = mapped_column('text', Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    type: Mapped[str] = mapped_column(Unicode(32, 'SQL_Latin1_General_CP1_CI_AS'))
    order: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(Unicode(32, 'SQL_Latin1_General_CP1_CI_AS'), server_default=text("('QUALITY')"))

    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='questions')
    options: Mapped[List['Options']] = relationship('Options', back_populates='question')
    question_options: Mapped[List['QuestionOptions']] = relationship('QuestionOptions', back_populates='question')
    survey_responses: Mapped[List['SurveyResponses']] = relationship('SurveyResponses', back_populates='question')
    answers: Mapped[List['Answers']] = relationship('Answers', back_populates='question')
    question_answers: Mapped[List['QuestionAnswers']] = relationship('QuestionAnswers', back_populates='question')
    survey_answers: Mapped[List['SurveyAnswers']] = relationship('SurveyAnswers', back_populates='question')


class ResponsivenessRatings(Base):
    __tablename__ = 'responsiveness_ratings'
    __table_args__ = (
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__responsiv__surve__7E02B4CC'),
        PrimaryKeyConstraint('id', name='PK__responsi__3213E83FA30F0758'),
        Index('ix_dbo_responsiveness_ratings_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    average: Mapped[float] = mapped_column(Float(53))
    responsiveness_complaints_promptly: Mapped[Optional[int]] = mapped_column(Integer)
    responsiveness_service_when_needed: Mapped[Optional[int]] = mapped_column(Integer)
    responsiveness_quickly_changed_needs: Mapped[Optional[int]] = mapped_column(Integer)
    responsiveness_goes_extra_mile: Mapped[Optional[int]] = mapped_column(Integer)
    understand_needs: Mapped[Optional[int]] = mapped_column(Integer)
    metric2: Mapped[Optional[int]] = mapped_column(Integer)
    metric3: Mapped[Optional[int]] = mapped_column(Integer)
    metric4: Mapped[Optional[int]] = mapped_column(Integer)
    reason: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))

    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='responsiveness_ratings')


class SurveySubmissions(Base):
    __tablename__ = 'survey_submissions'
    __table_args__ = (
        ForeignKeyConstraint(['rated_department_id'], ['dbo.departments.id'], name='FK__survey_su__rated__336AA144'),
        ForeignKeyConstraint(['submitter_department_id'], ['dbo.departments.id'], name='FK__survey_su__submi__32767D0B'),
        ForeignKeyConstraint(['submitter_user_id'], ['dbo.admin_users.id'], name='FK__survey_su__submi__318258D2'),
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__survey_su__surve__308E3499'),
        PrimaryKeyConstraint('id', name='PK__survey_s__3213E83FC862F750'),
        Index('ix_dbo_survey_submissions_id', 'id'),
        Index('uq_user_survey_submission', 'survey_id', 'submitter_user_id', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    submitter_user_id: Mapped[int] = mapped_column(Integer)
    submitter_department_id: Mapped[int] = mapped_column(Integer)
    rated_department_id: Mapped[int] = mapped_column(Integer)
    submitted_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))
    overall_customer_rating: Mapped[Optional[float]] = mapped_column(Float(53))
    rating_description: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    suggestions: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    status: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'), server_default=text("('submitted')"))
    answers_by_category: Mapped[Optional[str]] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'))

    rated_department: Mapped['Departments'] = relationship('Departments', foreign_keys=[rated_department_id], back_populates='survey_submissions')
    submitter_department: Mapped['Departments'] = relationship('Departments', foreign_keys=[submitter_department_id], back_populates='survey_submissions_')
    submitter_user: Mapped['AdminUsers'] = relationship('AdminUsers', back_populates='survey_submissions')
    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='survey_submissions')
    survey_responses: Mapped[List['SurveyResponses']] = relationship('SurveyResponses', back_populates='survey_submission')
    answers: Mapped[List['Answers']] = relationship('Answers', back_populates='submission')
    survey_answers: Mapped[List['SurveyAnswers']] = relationship('SurveyAnswers', back_populates='submission')


class Options(Base):
    __tablename__ = 'options'
    __table_args__ = (
        ForeignKeyConstraint(['question_id'], ['dbo.questions.id'], name='FK__options__questio__2116E6DF'),
        PrimaryKeyConstraint('id', name='PK__options__3213E83F6789973B'),
        Index('ix_dbo_options_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    question_id: Mapped[int] = mapped_column(Integer)
    text_: Mapped[str] = mapped_column('text', String(collation='SQL_Latin1_General_CP1_CI_AS'))
    order: Mapped[int] = mapped_column(Integer)
    value: Mapped[Optional[int]] = mapped_column(Integer)

    question: Mapped['Questions'] = relationship('Questions', back_populates='options')
    answers: Mapped[List['Answers']] = relationship('Answers', back_populates='selected_option')


class QuestionOptions(Base):
    __tablename__ = 'question_options'
    __table_args__ = (
        ForeignKeyConstraint(['question_id'], ['dbo.questions.id'], name='FK__question___quest__6CD828CA'),
        PrimaryKeyConstraint('id', name='PK__question__3213E83F02DB27B7'),
        Index('ix_dbo_question_options_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    question_id: Mapped[int] = mapped_column(Integer)
    text_: Mapped[str] = mapped_column('text', String(collation='SQL_Latin1_General_CP1_CI_AS'))
    order: Mapped[int] = mapped_column(Integer)
    value: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))

    question: Mapped['Questions'] = relationship('Questions', back_populates='question_options')
    question_answers: Mapped[List['QuestionAnswers']] = relationship('QuestionAnswers', back_populates='selected_option')
    survey_answers: Mapped[List['SurveyAnswers']] = relationship('SurveyAnswers', back_populates='selected_option')


class SurveyResponses(Base):
    __tablename__ = 'survey_responses'
    __table_args__ = (
        ForeignKeyConstraint(['from_department_id'], ['dbo.departments.id'], name='FK_survey_responses_from_department'),
        ForeignKeyConstraint(['question_id'], ['dbo.questions.id'], name='FK_survey_responses_question'),
        ForeignKeyConstraint(['survey_id'], ['dbo.surveys.id'], name='FK__survey_re__surve__690797E6'),
        ForeignKeyConstraint(['survey_submission_id'], ['dbo.survey_submissions.id'], name='FK_survey_responses_submission'),
        ForeignKeyConstraint(['to_department_id'], ['dbo.departments.id'], name='FK_survey_responses_to_department'),
        ForeignKeyConstraint(['user_id'], ['dbo.admin_users.id'], name='FK__survey_re__user___69FBBC1F'),
        PrimaryKeyConstraint('id', name='PK__survey_r__3213E83FE544A2BA'),
        Index('ix_dbo_survey_responses_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    survey_id: Mapped[int] = mapped_column(Integer)
    user_id: Mapped[int] = mapped_column(Integer)
    submitted_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))
    final_suggestion: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    from_department_id: Mapped[Optional[int]] = mapped_column(Integer)
    to_department_id: Mapped[Optional[int]] = mapped_column(Integer)
    question_id: Mapped[Optional[int]] = mapped_column(Integer)
    rating: Mapped[Optional[int]] = mapped_column(Integer)
    remark: Mapped[Optional[str]] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'))
    explanation: Mapped[Optional[str]] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'))
    action_plan: Mapped[Optional[str]] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'))
    responsible_person: Mapped[Optional[str]] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'))
    acknowledged: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('((0))'))
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    survey_submission_id: Mapped[Optional[int]] = mapped_column(Integer)
    responded_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    from_department: Mapped[Optional['Departments']] = relationship('Departments', foreign_keys=[from_department_id], back_populates='survey_responses')
    question: Mapped[Optional['Questions']] = relationship('Questions', back_populates='survey_responses')
    survey: Mapped['Surveys'] = relationship('Surveys', back_populates='survey_responses')
    survey_submission: Mapped[Optional['SurveySubmissions']] = relationship('SurveySubmissions', back_populates='survey_responses')
    to_department: Mapped[Optional['Departments']] = relationship('Departments', foreign_keys=[to_department_id], back_populates='survey_responses_')
    user: Mapped['AdminUsers'] = relationship('AdminUsers', back_populates='survey_responses')
    question_answers: Mapped[List['QuestionAnswers']] = relationship('QuestionAnswers', back_populates='response')


class Answers(Base):
    __tablename__ = 'answers'
    __table_args__ = (
        ForeignKeyConstraint(['question_id'], ['dbo.questions.id'], name='FK__answers__questio__25DB9BFC'),
        ForeignKeyConstraint(['selected_option_id'], ['dbo.options.id'], name='FK__answers__selecte__26CFC035'),
        ForeignKeyConstraint(['submission_id'], ['dbo.survey_submissions.id'], name='FK__answers__submiss__24E777C3'),
        PrimaryKeyConstraint('id', name='PK__answers__3213E83F0CF4EAEE'),
        Index('ix_dbo_answers_id', 'id'),
        Index('uq_answer_per_question', 'submission_id', 'question_id', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    submission_id: Mapped[int] = mapped_column(Integer)
    question_id: Mapped[int] = mapped_column(Integer)
    rating_value: Mapped[Optional[int]] = mapped_column(Integer)
    text_response: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer)

    question: Mapped['Questions'] = relationship('Questions', back_populates='answers')
    selected_option: Mapped[Optional['Options']] = relationship('Options', back_populates='answers')
    submission: Mapped['SurveySubmissions'] = relationship('SurveySubmissions', back_populates='answers')


class QuestionAnswers(Base):
    __tablename__ = 'question_answers'
    __table_args__ = (
        ForeignKeyConstraint(['question_id'], ['dbo.questions.id'], name='FK__question___quest__70A8B9AE'),
        ForeignKeyConstraint(['response_id'], ['dbo.survey_responses.id'], name='FK__question___respo__6FB49575'),
        ForeignKeyConstraint(['selected_option_id'], ['dbo.question_options.id'], name='FK__question___selec__719CDDE7'),
        PrimaryKeyConstraint('id', name='PK__question__3213E83F7CB57FCA'),
        Index('ix_dbo_question_answers_id', 'id'),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    response_id: Mapped[int] = mapped_column(Integer)
    question_id: Mapped[int] = mapped_column(Integer)
    rating: Mapped[Optional[int]] = mapped_column(Integer)
    text_answer: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer)

    question: Mapped['Questions'] = relationship('Questions', back_populates='question_answers')
    response: Mapped['SurveyResponses'] = relationship('SurveyResponses', back_populates='question_answers')
    selected_option: Mapped[Optional['QuestionOptions']] = relationship('QuestionOptions', back_populates='question_answers')


class SurveyAnswers(Base):
    __tablename__ = 'survey_answers'
    __table_args__ = (
        ForeignKeyConstraint(['question_id'], ['dbo.questions.id'], name='FK__survey_an__quest__382F5661'),
        ForeignKeyConstraint(['selected_option_id'], ['dbo.question_options.id'], name='FK__survey_an__selec__39237A9A'),
        ForeignKeyConstraint(['submission_id'], ['dbo.survey_submissions.id'], name='FK__survey_an__submi__373B3228'),
        PrimaryKeyConstraint('id', name='PK__survey_a__3213E83F34220F7B'),
        Index('ix_dbo_survey_answers_id', 'id'),
        Index('uq_submission_question_answer', 'submission_id', 'question_id', unique=True),
        {'schema': 'dbo'}
    )

    id: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    submission_id: Mapped[int] = mapped_column(Integer)
    question_id: Mapped[int] = mapped_column(Integer)
    rating_value: Mapped[Optional[int]] = mapped_column(Integer)
    text_response: Mapped[Optional[str]] = mapped_column(String(collation='SQL_Latin1_General_CP1_CI_AS'))
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer)

    question: Mapped['Questions'] = relationship('Questions', back_populates='survey_answers')
    selected_option: Mapped[Optional['QuestionOptions']] = relationship('QuestionOptions', back_populates='survey_answers')
    submission: Mapped['SurveySubmissions'] = relationship('SurveySubmissions', back_populates='survey_answers')
