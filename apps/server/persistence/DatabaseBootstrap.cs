using Microsoft.EntityFrameworkCore;

namespace persistence;

public static class DatabaseBootstrap
{
    public static async Task EnsureAdminsTableAsync(
        this UniMapDbContext db,
        CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS admins (
                id uuid NOT NULL,
                username character varying(64) NOT NULL,
                email character varying(320) NOT NULL,
                password_hash character varying(500) NOT NULL,
                role character varying(64) NOT NULL DEFAULT 'admin',
                created_at timestamp with time zone NOT NULL,
                updated_at timestamp with time zone NOT NULL,
                last_login_at timestamp with time zone,
                CONSTRAINT "PK_admins" PRIMARY KEY (id)
            );

            ALTER TABLE admins
            ADD COLUMN IF NOT EXISTS username character varying(64) NOT NULL DEFAULT '';

            UPDATE admins
            SET username = 'admin_' || replace(substring(id::text, 1, 8), '-', '')
            WHERE username = '';

            ALTER TABLE admins
            ADD COLUMN IF NOT EXISTS role character varying(64) NOT NULL DEFAULT 'admin';

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_admins_username" ON admins (username);
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_admins_email" ON admins (email);
            CREATE INDEX IF NOT EXISTS "IX_admins_created_at" ON admins (created_at);

            UPDATE admins SET role = 'admin' WHERE role IS NULL OR role NOT IN ('admin', 'super_admin');

            ALTER TABLE admins DROP CONSTRAINT IF EXISTS "CK_admins_role";
            ALTER TABLE admins ADD CONSTRAINT "CK_admins_role" CHECK (role IN ('admin', 'super_admin'));
            """,
            cancellationToken);
    }

    /// <summary>Відновлює таблицю location після випадкового DROP (порожня схема + заглушки для існуючих FK).</summary>
    public static async Task EnsureLocationTableAsync(
        this UniMapDbContext db,
        CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(
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
            """,
            cancellationToken);
    }

    /// <summary>Відновлює location_photo, якщо міграція в історії, а таблиці немає (напр. після DROP location CASCADE).</summary>
    public static async Task EnsureLocationPhotoTableAsync(
        this UniMapDbContext db,
        CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(
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
            """,
            cancellationToken);
    }
}
