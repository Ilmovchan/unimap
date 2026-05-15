using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace persistence.Migrations;

/// <inheritdoc />
public partial class LocationUniversityObjectSchema : Migration
{
    private static readonly DateTimeOffset SeedTime =
        new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "university_object_type",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                name_uk = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            },
            constraints: table => table.PrimaryKey("PK_university_object_type", x => x.id));

        migrationBuilder.CreateIndex(
            name: "IX_university_object_type_code",
            table: "university_object_type",
            column: "code",
            unique: true);

        SeedUniversityObjectTypes(migrationBuilder);

        migrationBuilder.DropIndex(
            name: "IX_location_type_title",
            table: "location_type");

        migrationBuilder.AddColumn<string>(
            name: "code",
            table: "location_type",
            type: "character varying(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "marker_key",
            table: "location_type",
            type: "character varying(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "name_uk",
            table: "location_type",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE location_type lt
            SET
                name_uk = COALESCE(NULLIF(trim(lt.title), ''), 'Інше'),
                code = CASE
                    WHEN lower(trim(lt.title)) LIKE '%бібліотек%' OR lower(trim(lt.title)) LIKE '%library%' THEN 'library'
                    WHEN lower(trim(lt.title)) LIKE '%стадіон%' OR lower(trim(lt.title)) LIKE '%stadium%' OR lower(trim(lt.title)) LIKE '%спортив%' THEN 'sport_facility'
                    WHEN lower(trim(lt.title)) LIKE '%адмін%' THEN 'administrative_building'
                    WHEN lower(trim(lt.title)) LIKE '%навчаль%' OR lower(trim(lt.title)) LIKE '%корпус%' OR lower(trim(lt.title)) LIKE '%будівл%' THEN 'academic_building'
                    ELSE 'other'
                END,
                marker_key = CASE
                    WHEN lower(trim(lt.title)) LIKE '%бібліотек%' OR lower(trim(lt.title)) LIKE '%library%' THEN 'library'
                    WHEN lower(trim(lt.title)) LIKE '%стадіон%' OR lower(trim(lt.title)) LIKE '%stadium%' OR lower(trim(lt.title)) LIKE '%спортив%' THEN 'stadium'
                    WHEN lower(trim(lt.title)) LIKE '%адмін%' THEN 'admin'
                    WHEN lower(trim(lt.title)) LIKE '%навчаль%' OR lower(trim(lt.title)) LIKE '%корпус%' OR lower(trim(lt.title)) LIKE '%будівл%' THEN 'building'
                    ELSE 'default'
                END;
            """);

        migrationBuilder.AlterColumn<string>(
            name: "code",
            table: "location_type",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(50)",
            oldMaxLength: 50,
            oldNullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "marker_key",
            table: "location_type",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(50)",
            oldMaxLength: 50,
            oldNullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "name_uk",
            table: "location_type",
            type: "character varying(100)",
            maxLength: 100,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(100)",
            oldMaxLength: 100,
            oldNullable: true);

        migrationBuilder.DropColumn(
            name: "title",
            table: "location_type");

        migrationBuilder.CreateIndex(
            name: "IX_location_type_code",
            table: "location_type",
            column: "code",
            unique: true);

        migrationBuilder.RenameColumn(
            name: "lat",
            table: "location",
            newName: "latitude");

        migrationBuilder.RenameColumn(
            name: "lng",
            table: "location",
            newName: "longitude");

        migrationBuilder.AddColumn<string>(
            name: "address",
            table: "location",
            type: "character varying(255)",
            maxLength: 255,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "description",
            table: "location",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "image_url",
            table: "location",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "name",
            table: "location",
            type: "character varying(150)",
            maxLength: 150,
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE location l
            SET name = left(trim(COALESCE(
                (SELECT u.title FROM department u WHERE u.location_id = l.id ORDER BY u.title LIMIT 1),
                ''
            )), 150);

            UPDATE location
            SET name = 'Локація'
            WHERE name IS NULL OR trim(name) = '';
            """);

        migrationBuilder.AlterColumn<string>(
            name: "name",
            table: "location",
            type: "character varying(150)",
            maxLength: 150,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(150)",
            oldMaxLength: 150,
            oldNullable: true);

        migrationBuilder.RenameTable(
            name: "department",
            newName: "university_object");

        migrationBuilder.RenameColumn(
            name: "title",
            table: "university_object",
            newName: "name");

        migrationBuilder.RenameIndex(
            name: "IX_department_location_id",
            table: "university_object",
            newName: "IX_university_object_location_id");

        migrationBuilder.RenameIndex(
            name: "IX_department_title",
            table: "university_object",
            newName: "IX_university_object_name");

        migrationBuilder.AddColumn<Guid>(
            name: "object_type_id",
            table: "university_object",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "floor",
            table: "university_object",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "room_number",
            table: "university_object",
            type: "character varying(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE university_object uo
            SET object_type_id = t.id
            FROM university_object_type t
            WHERE t.code = 'department' AND uo.object_type_id IS NULL;
            """);

        migrationBuilder.AlterColumn<Guid>(
            name: "object_type_id",
            table: "university_object",
            type: "uuid",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uuid",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_university_object_object_type_id",
            table: "university_object",
            column: "object_type_id");

        migrationBuilder.AddForeignKey(
            name: "FK_university_object_university_object_type_object_type_id",
            table: "university_object",
            column: "object_type_id",
            principalTable: "university_object_type",
            principalColumn: "id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_university_object_university_object_type_object_type_id",
            table: "university_object");

        migrationBuilder.DropIndex(
            name: "IX_university_object_object_type_id",
            table: "university_object");

        migrationBuilder.DropColumn(
            name: "object_type_id",
            table: "university_object");

        migrationBuilder.DropColumn(
            name: "floor",
            table: "university_object");

        migrationBuilder.DropColumn(
            name: "room_number",
            table: "university_object");

        migrationBuilder.RenameIndex(
            name: "IX_university_object_name",
            table: "university_object",
            newName: "IX_department_title");

        migrationBuilder.RenameIndex(
            name: "IX_university_object_location_id",
            table: "university_object",
            newName: "IX_department_location_id");

        migrationBuilder.RenameColumn(
            name: "name",
            table: "university_object",
            newName: "title");

        migrationBuilder.RenameTable(
            name: "university_object",
            newName: "department");

        migrationBuilder.DropColumn(
            name: "address",
            table: "location");

        migrationBuilder.DropColumn(
            name: "description",
            table: "location");

        migrationBuilder.DropColumn(
            name: "image_url",
            table: "location");

        migrationBuilder.DropColumn(
            name: "name",
            table: "location");

        migrationBuilder.RenameColumn(
            name: "latitude",
            table: "location",
            newName: "lat");

        migrationBuilder.RenameColumn(
            name: "longitude",
            table: "location",
            newName: "lng");

        migrationBuilder.DropIndex(
            name: "IX_location_type_code",
            table: "location_type");

        migrationBuilder.AddColumn<string>(
            name: "title",
            table: "location_type",
            type: "character varying(200)",
            maxLength: 200,
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql(
            """
            UPDATE location_type lt
            SET title = lt.name_uk;
            """);

        migrationBuilder.DropColumn(
            name: "code",
            table: "location_type");

        migrationBuilder.DropColumn(
            name: "marker_key",
            table: "location_type");

        migrationBuilder.DropColumn(
            name: "name_uk",
            table: "location_type");

        migrationBuilder.CreateIndex(
            name: "IX_location_type_title",
            table: "location_type",
            column: "title");

        migrationBuilder.DropTable(
            name: "university_object_type");
    }

    private static void SeedUniversityObjectTypes(MigrationBuilder migrationBuilder)
    {
        void Row(Guid id, string code, string nameUk) =>
            migrationBuilder.InsertData(
                table: "university_object_type",
                columns: new[] { "id", "code", "name_uk", "created_at", "updated_at" },
                values: new object[] { id, code, nameUk, SeedTime, SeedTime });

        Row(Guid.Parse("b1000001-0001-4000-8000-000000000001"), "faculty", "Факультет");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000002"), "department", "Кафедра");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000003"), "administrative_unit", "Адміністративний підрозділ");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000004"), "classroom", "Аудиторія");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000005"), "library_unit", "Бібліотечний підрозділ");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000006"), "sport_object", "Спортивний об’єкт");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000007"), "service", "Сервіс");
        Row(Guid.Parse("b1000001-0001-4000-8000-000000000008"), "other", "Інше");
    }
}
