using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLocationPhotoIsMain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_location_photo_location_id_is_main",
                table: "location_photo");

            migrationBuilder.DropColumn(
                name: "is_main",
                table: "location_photo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_main",
                table: "location_photo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_location_photo_location_id_is_main",
                table: "location_photo",
                columns: new[] { "location_id", "is_main" },
                unique: true,
                filter: "is_main = true");
        }
    }
}
