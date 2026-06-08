using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(UniMapDbContext))]
[Migration("20260608073500_AlignLocationTitleColumn")]
public partial class AlignLocationTitleColumn : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            BEGIN
                ALTER TABLE location
                    ADD COLUMN IF NOT EXISTS title character varying(150);

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'location'
                      AND column_name = 'name'
                ) THEN
                    UPDATE location
                    SET title = left(trim(name), 150)
                    WHERE (title IS NULL OR trim(title) = '')
                      AND name IS NOT NULL
                      AND trim(name) <> '';
                END IF;

                UPDATE location
                SET title = 'Локація'
                WHERE title IS NULL OR trim(title) = '';

                ALTER TABLE location
                    ALTER COLUMN title SET NOT NULL;

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'location'
                      AND column_name = 'name'
                ) THEN
                    ALTER TABLE location
                        ALTER COLUMN name DROP NOT NULL;
                END IF;
            END $$;

            DROP INDEX IF EXISTS "IX_location_name";
            CREATE INDEX IF NOT EXISTS "IX_location_title"
                ON location (title);
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $$
            BEGIN
                ALTER TABLE location
                    ADD COLUMN IF NOT EXISTS name character varying(150);

                UPDATE location
                SET name = left(trim(title), 150)
                WHERE (name IS NULL OR trim(name) = '')
                  AND title IS NOT NULL
                  AND trim(title) <> '';

                UPDATE location
                SET name = 'Локація'
                WHERE name IS NULL OR trim(name) = '';

                ALTER TABLE location
                    ALTER COLUMN name SET NOT NULL;
            END $$;

            DROP INDEX IF EXISTS "IX_location_title";
            CREATE INDEX IF NOT EXISTS "IX_location_name"
                ON location (name);
            """);
    }
}
