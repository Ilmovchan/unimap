namespace app.Models.Admin;

public sealed record LocationTypeAdminCreateCommand(
    Guid? Id,
    string? Code,
    string? TitleUk,
    string? MarkerKey);

public sealed record LocationTypeAdminUpdateCommand(
    string? Code,
    string? TitleUk,
    string? MarkerKey);
