using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(UniMapDbContext))]
[Migration("20260612143000_AddUniversityObjectContactFields")]
public partial class AddUniversityObjectContactFields : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE university_object
                ADD COLUMN IF NOT EXISTS phone_number character varying(64),
                ADD COLUMN IF NOT EXISTS web_url character varying(2000);

            UPDATE university_object
            SET web_url = website_url
            WHERE web_url IS NULL
              AND website_url IS NOT NULL;

            ALTER TABLE university_object
                DROP COLUMN IF EXISTS website_url;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE university_object
                ADD COLUMN IF NOT EXISTS website_url character varying(2000);

            UPDATE university_object
            SET website_url = web_url
            WHERE website_url IS NULL
              AND web_url IS NOT NULL;

            ALTER TABLE university_object
                DROP COLUMN IF EXISTS web_url,
                DROP COLUMN IF EXISTS phone_number;
            """);
    }
}
