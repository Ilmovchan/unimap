namespace app.Models.Admin;

public sealed record UniversityObjectAdminCreateCommand(
    Guid? Id,
    Guid LocationId,
    Guid ObjectTypeId,
    string? Title,
    string? Description);

public sealed record UniversityObjectAdminUpdateCommand(
    Guid LocationId,
    Guid ObjectTypeId,
    string? Title,
    string? Description);
