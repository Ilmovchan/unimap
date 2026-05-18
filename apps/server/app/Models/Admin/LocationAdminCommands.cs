namespace app.Models.Admin;

public sealed record LocationAdminCreateCommand(
    Guid? Id,
    Guid LocationTypeId,
    string? Title,
    double? Latitude,
    double? Longitude,
    string? Description,
    string? AddressJson);

public sealed record LocationAdminUpdateCommand(
    Guid LocationTypeId,
    string? Title,
    double? Latitude,
    double? Longitude,
    string? Description,
    string? AddressJson);
