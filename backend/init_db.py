import pyodbc

def add_answers_by_category_column():
    conn_str = (
        "Driver={ODBC Driver 17 for SQL Server};"
        "Server=localhost;"
        "Database=SurveyCompassDB;"  # Replace with your actual DB name if different
        "Trusted_Connection=yes;"
    )
    with pyodbc.connect(conn_str) as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE Name = N'answers_by_category' AND Object_ID = Object_ID(N'dbo.survey_submissions')
                )
                BEGIN
                    ALTER TABLE dbo.survey_submissions
                    ADD answers_by_category NVARCHAR(MAX) NULL
                END
            """)
            conn.commit()
            print("Column 'answers_by_category' added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_answers_by_category_column()
