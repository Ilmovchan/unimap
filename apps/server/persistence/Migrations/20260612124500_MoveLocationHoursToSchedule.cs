using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(UniMapDbContext))]
[Migration("20260612124500_MoveLocationHoursToSchedule")]
public partial class MoveLocationHoursToSchedule : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS schedule (
                id uuid NOT NULL,
                location_id uuid NOT NULL,
                day_of_week integer NOT NULL,
                opening_at time without time zone,
                closing_at time without time zone,
                is_closed boolean NOT NULL,
                CONSTRAINT "PK_schedule" PRIMARY KEY (id),
                CONSTRAINT "FK_schedule_location_location_id" FOREIGN KEY (location_id)
                    REFERENCES location (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_schedule_location_id"
                ON schedule (location_id);

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_schedule_location_id_day_of_week"
                ON schedule (location_id, day_of_week);

            ALTER TABLE location
                DROP COLUMN IF EXISTS opening_at,
                DROP COLUMN IF EXISTS closing_at;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE location
                ADD COLUMN IF NOT EXISTS opening_at time without time zone,
                ADD COLUMN IF NOT EXISTS closing_at time without time zone;

            DROP TABLE IF EXISTS schedule;
            """);
    }
}
