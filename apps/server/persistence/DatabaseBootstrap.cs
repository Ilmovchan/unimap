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
}
