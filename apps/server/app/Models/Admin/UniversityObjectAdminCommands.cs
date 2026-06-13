namespace app.Models.Admin;

public sealed record UniversityObjectAdminCreateCommand(
    Guid? Id,
    Guid LocationId,
    Guid ObjectTypeId,
    string? Title,
    string? Description,
    string? Manager,
    string? PhoneNumber,
    string? WebUrl);

public sealed record UniversityObjectAdminUpdateCommand(
    Guid LocationId,
    Guid ObjectTypeId,
    string? Title,
    string? Description,
    string? Manager,
    string? PhoneNumber,
    string? WebUrl);
