-- Check if 'order' column exists in dbo.question_options
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE Name = N'order' 
    AND Object_ID = Object_ID(N'dbo.question_options')
)
BEGIN
    ALTER TABLE dbo.question_options
    ADD [order] INT NOT NULL DEFAULT 0;
END
GO

-- Optional: Remove default constraint if needed after adding the column
-- Find and drop default constraint for dbo.question_options.order if exists
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('dbo.question_options') AND c.name = 'order';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.question_options DROP CONSTRAINT ' + @ConstraintName);
END
GO
