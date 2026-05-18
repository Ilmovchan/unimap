namespace app.Models.Admin;

public sealed record NewsAdminCreateCommand(
    Guid? Id,
    string? Title,
    string? Content,
    bool? IsActive);

public sealed record NewsAdminUpdateCommand(
    string? Title,
    string? Content,
    bool? IsActive);
