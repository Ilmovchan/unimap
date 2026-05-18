namespace app.Models.Admin;

public sealed record UniversityObjectTypeAdminCreateCommand(
    Guid? Id,
    string? Code,
    string? TitleUk);

public sealed record UniversityObjectTypeAdminUpdateCommand(
    string? Code,
    string? TitleUk);
