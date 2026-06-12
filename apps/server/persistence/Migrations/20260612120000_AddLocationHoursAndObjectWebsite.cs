using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(UniMapDbContext))]
[Migration("20260612120000_AddLocationHoursAndObjectWebsite")]
public partial class AddLocationHoursAndObjectWebsite : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE location
                ADD COLUMN IF NOT EXISTS opening_at time without time zone,
                ADD COLUMN IF NOT EXISTS closing_at time without time zone;

            ALTER TABLE university_object
                ADD COLUMN IF NOT EXISTS website_url character varying(2000);
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE university_object
                DROP COLUMN IF EXISTS website_url;

            ALTER TABLE location
                DROP COLUMN IF EXISTS closing_at,
                DROP COLUMN IF EXISTS opening_at;
            """);
    }
}
