using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLocationImageUrlColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE location DROP COLUMN IF EXISTS image_url;
                ALTER TABLE location DROP COLUMN IF EXISTS photo_id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "location",
                type: "text",
                nullable: true);
        }
    }
}
