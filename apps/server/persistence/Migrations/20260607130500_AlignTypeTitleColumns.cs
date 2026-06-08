using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(UniMapDbContext))]
[Migration("20260607130500_AlignTypeTitleColumns")]
public partial class AlignTypeTitleColumns : Migration
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
                      AND table_name = 'location_type'
                      AND column_name = 'name_uk'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'location_type'
                      AND column_name = 'title_uk'
                ) THEN
                    ALTER TABLE location_type RENAME COLUMN name_uk TO title_uk;
                END IF;

                ALTER TABLE location_type
                    ADD COLUMN IF NOT EXISTS title_uk character varying(100);

                UPDATE location_type
                SET title_uk = COALESCE(NULLIF(trim(title_uk), ''), code, 'Інше')
                WHERE title_uk IS NULL OR trim(title_uk) = '';

                ALTER TABLE location_type
                    ALTER COLUMN title_uk SET NOT NULL;
            END $$;

            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object_type'
                      AND column_name = 'name_uk'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object_type'
                      AND column_name = 'title_uk'
                ) THEN
                    ALTER TABLE university_object_type RENAME COLUMN name_uk TO title_uk;
                END IF;

                ALTER TABLE university_object_type
                    ADD COLUMN IF NOT EXISTS title_uk character varying(100);

                UPDATE university_object_type
                SET title_uk = COALESCE(NULLIF(trim(title_uk), ''), code, 'Інше')
                WHERE title_uk IS NULL OR trim(title_uk) = '';

                ALTER TABLE university_object_type
                    ALTER COLUMN title_uk SET NOT NULL;
            END $$;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'location_type'
                      AND column_name = 'title_uk'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'location_type'
                      AND column_name = 'name_uk'
                ) THEN
                    ALTER TABLE location_type RENAME COLUMN title_uk TO name_uk;
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object_type'
                      AND column_name = 'title_uk'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'university_object_type'
                      AND column_name = 'name_uk'
                ) THEN
                    ALTER TABLE university_object_type RENAME COLUMN title_uk TO name_uk;
                END IF;
            END $$;
            """);
    }
}
