-- База вже існує (EnsureCreated / ручне створення), але __EFMigrationsHistory порожня.
-- Виконай цей скрипт ОДИН РАЗ, потім: dotnet ef database update --project persistence --startup-project api
--
-- Перевір, що таблиці location / location_type / university_object вже є:
--   \dt

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES
    ('20260514091614_InitialLocationDepartmentModel', '9.0.6'),
    ('20260514141508_RemoveLocationTitleDescription', '9.0.6'),
    ('20260514145034_LocationUniversityObjectSchema', '9.0.6'),
    ('20260514160501_SyncSnapshotWithDomainModel', '9.0.6')
ON CONFLICT ("MigrationId") DO NOTHING;
