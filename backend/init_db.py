import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Import all models from your new_models1.py
from new_models1 import Base, AdminUsers, Departments, Login, Periods, Surveys, Users, \
    CommunicationRatings, DeliveryRatings, ImprovementRatings, Permissions, QualityRatings, \
    Questions, ResponsivenessRatings, SurveyResponses, SurveySubmissions, Options, \
    QuestionOptions, RemarkResponses, Answers, QuestionAnswers, SurveyAnswers

load_dotenv() # Load environment variables from .env file

# Construct the database URL from environment variables
DATABASE_URL = (
    f"mssql+pyodbc://{os.getenv('MSSQL_USER')}:{os.getenv('MSSQL_PASSWORD')}@"
    f"{os.getenv('MSSQL_SERVER')},{os.getenv('MSSQL_DB')}?driver=ODBC+Driver+17+for+SQL+Server"
)

# Create the SQLAlchemy engine
# echo=True will print all SQL statements, useful for debugging
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(engine)
    print("Database tables created successfully.")

if __name__ == "__main__":
    init_db()