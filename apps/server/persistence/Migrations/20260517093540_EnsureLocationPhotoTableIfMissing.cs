using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
public partial class EnsureLocationPhotoTableIfMissing : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS location_photo (
                id uuid NOT NULL,
                location_id uuid NOT NULL,
                image_url character varying(2000) NOT NULL,
                storage_key character varying(500) NOT NULL,
                alt_uk character varying(500),
                is_main boolean NOT NULL,
                created_at timestamp with time zone NOT NULL,
                updated_at timestamp with time zone NOT NULL,
                CONSTRAINT "PK_location_photo" PRIMARY KEY (id)
            );

            CREATE INDEX IF NOT EXISTS "IX_location_photo_location_id"
                ON location_photo (location_id);

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_location_photo_storage_key"
                ON location_photo (storage_key);

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_location_photo_location_id_is_main"
                ON location_photo (location_id, is_main)
                WHERE is_main = true;

            DO $$
            BEGIN
                IF to_regclass('public.location') IS NOT NULL
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
    }
}
