using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationPhotosTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS location_picture CASCADE;
                DROP TABLE IF EXISTS location_photos CASCADE;
                """);

            migrationBuilder.CreateTable(
                name: "location_photo",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<Guid>(type: "uuid", nullable: false),
                    image_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    alt_uk = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_main = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_location_photo", x => x.id);
                    table.ForeignKey(
                        name: "FK_location_photo_location_location_id",
                        column: x => x.location_id,
                        principalTable: "location",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_location_photo_location_id",
                table: "location_photo",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_location_photo_location_id_is_main",
                table: "location_photo",
                columns: new[] { "location_id", "is_main" },
                unique: true,
                filter: "is_main = true");

            migrationBuilder.CreateIndex(
                name: "IX_location_photo_storage_key",
                table: "location_photo",
                column: "storage_key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "location_photo");

            migrationBuilder.CreateTable(
                name: "location_picture",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<Guid>(type: "uuid", nullable: false),
                    alt_uk = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    image_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    is_main = table.Column<bool>(type: "boolean", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_location_picture", x => x.id);
                    table.ForeignKey(
                        name: "FK_location_picture_location_location_id",
                        column: x => x.location_id,
                        principalTable: "location",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_location_picture_location_id",
                table: "location_picture",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_location_picture_location_id_is_main",
                table: "location_picture",
                columns: new[] { "location_id", "is_main" },
                unique: true,
                filter: "is_main = true");
        }
    }
}
