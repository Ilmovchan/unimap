using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialLocationDepartmentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "location_type",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_location_type", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "location",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lat = table.Column<double>(type: "double precision", nullable: false),
                    lng = table.Column<double>(type: "double precision", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    address_json = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_location", x => x.id);
                    table.ForeignKey(
                        name: "FK_location_location_type_location_type_id",
                        column: x => x.location_type_id,
                        principalTable: "location_type",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "department",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_department", x => x.id);
                    table.ForeignKey(
                        name: "FK_department_location_location_id",
                        column: x => x.location_id,
                        principalTable: "location",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_department_location_id",
                table: "department",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_department_title",
                table: "department",
                column: "title");

            migrationBuilder.CreateIndex(
                name: "IX_location_location_type_id",
                table: "location",
                column: "location_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_location_title",
                table: "location",
                column: "title");

            migrationBuilder.CreateIndex(
                name: "IX_location_type_title",
                table: "location_type",
                column: "title");

            // Перехід зі старої таблиці departments (одна сутність з координатами) на location + department.
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    default_type_id uuid;
                BEGIN
                    IF to_regclass('public.departments') IS NOT NULL
                       AND NOT EXISTS (SELECT 1 FROM public.location) THEN

                        default_type_id := gen_random_uuid();

                        INSERT INTO public.location_type (id, title, created_at, updated_at)
                        VALUES (
                            default_type_id,
                            'Інше',
                            (NOW() AT TIME ZONE 'utc'),
                            (NOW() AT TIME ZONE 'utc'));

                        INSERT INTO public.location (id, location_type_id, lat, lng, title, description, address_json, created_at, updated_at)
                        SELECT
                            d.id,
                            default_type_id,
                            d.lat,
                            d.lng,
                            d.title,
                            d.description,
                            CASE
                                WHEN trim(coalesce(d.address_json::text, '')) = '' THEN NULL
                                ELSE cast(d.address_json AS jsonb)
                            END,
                            d.created_at,
                            d.updated_at
                        FROM public.departments d;

                        INSERT INTO public.department (id, location_id, title, description, created_at, updated_at)
                        SELECT gen_random_uuid(), d.id, d.title, d.description, d.created_at, d.updated_at
                        FROM public.departments d;

                        DROP TABLE public.departments;
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "department");

            migrationBuilder.DropTable(
                name: "location");

            migrationBuilder.DropTable(
                name: "location_type");
        }
    }
}
