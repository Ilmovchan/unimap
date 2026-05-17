using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
public partial class RestoreLocationTableIfMissing : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS location (
                id uuid NOT NULL,
                location_type_id uuid NOT NULL,
                title character varying(150) NOT NULL,
                latitude double precision NOT NULL,
                longitude double precision NOT NULL,
                description text,
                address_json jsonb,
                created_at timestamp with time zone NOT NULL,
                updated_at timestamp with time zone NOT NULL,
                CONSTRAINT "PK_location" PRIMARY KEY (id)
            );

            CREATE INDEX IF NOT EXISTS "IX_location_location_type_id"
                ON location (location_type_id);

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'FK_location_location_type_location_type_id'
                ) THEN
                    ALTER TABLE location
                    ADD CONSTRAINT "FK_location_location_type_location_type_id"
                    FOREIGN KEY (location_type_id)
                    REFERENCES location_type (id)
                    ON DELETE RESTRICT;
                END IF;
            END $$;

            INSERT INTO location (
                id, location_type_id, title, latitude, longitude,
                description, address_json, created_at, updated_at
            )
            SELECT
                uo.location_id,
                (SELECT lt.id FROM location_type lt ORDER BY lt.code LIMIT 1),
                'Відновлена локація',
                0,
                0,
                NULL,
                NULL,
                NULL,
                (NOW() AT TIME ZONE 'utc'),
                (NOW() AT TIME ZONE 'utc')
            FROM university_object uo
            WHERE uo.location_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM location l WHERE l.id = uo.location_id)
            GROUP BY uo.location_id
            ON CONFLICT (id) DO NOTHING;

            DO $$
            BEGIN
                IF to_regclass('public.university_object') IS NOT NULL
                   AND NOT EXISTS (
                       SELECT 1 FROM pg_constraint
                       WHERE conname = 'FK_university_object_location_location_id'
                   ) THEN
                    ALTER TABLE university_object
                    ADD CONSTRAINT "FK_university_object_location_location_id"
                    FOREIGN KEY (location_id) REFERENCES location (id) ON DELETE CASCADE;
                END IF;
            END $$;

            DO $$
            BEGIN
                IF to_regclass('public.location_photo') IS NOT NULL
                   AND NOT EXISTS (
                       SELECT 1 FROM pg_constraint
                       WHERE conname = 'FK_location_photo_location_location_id'
                   ) THEN
                    ALTER TABLE location_photo
                    ADD CONSTRAINT "FK_location_photo_location_location_id"
                    FOREIGN KEY (location_id) REFERENCES location (id) ON DELETE CASCADE;
                END IF;
            END $$;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Навмисно порожньо: не видаляємо location при відкаті.
    }
}
