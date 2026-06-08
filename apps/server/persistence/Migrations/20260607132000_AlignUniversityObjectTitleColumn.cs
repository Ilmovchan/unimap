using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(UniMapDbContext))]
[Migration("20260607132000_AlignUniversityObjectTitleColumn")]
public partial class AlignUniversityObjectTitleColumn : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object'
                      AND column_name = 'name'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object'
                      AND column_name = 'title'
                ) THEN
                    ALTER TABLE university_object RENAME COLUMN name TO title;
                END IF;

                ALTER TABLE university_object
                    ADD COLUMN IF NOT EXISTS title character varying(500);

                UPDATE university_object
                SET title = 'Обʼєкт'
                WHERE title IS NULL OR trim(title) = '';

                ALTER TABLE university_object
                    ALTER COLUMN title SET NOT NULL;
            END $$;

            DROP INDEX IF EXISTS "IX_university_object_name";
            CREATE INDEX IF NOT EXISTS "IX_university_object_title"
                ON university_object (title);
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DROP INDEX IF EXISTS "IX_university_object_title";

            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object'
                      AND column_name = 'title'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object'
                      AND column_name = 'name'
                ) THEN
                    ALTER TABLE university_object RENAME COLUMN title TO name;
                END IF;
            END $$;

            CREATE INDEX IF NOT EXISTS "IX_university_object_name"
                ON university_object (name);
            """);
    }
}
