namespace app.Models.Admin;

public sealed record LocationAdminCreateCommand(
    Guid? Id,
    Guid LocationTypeId,
    string? Title,
    double? Latitude,
    double? Longitude,
    string? Description,
    string? AddressJson,
    bool HasShelter,
    IReadOnlyList<LocationScheduleAdminCommand>? Schedule);

public sealed record LocationAdminUpdateCommand(
    Guid LocationTypeId,
    string? Title,
    double? Latitude,
    double? Longitude,
    string? Description,
    string? AddressJson,
    bool HasShelter,
    IReadOnlyList<LocationScheduleAdminCommand>? Schedule);

public sealed record LocationScheduleAdminCommand(
    int DayOfWeek,
    TimeOnly? OpeningAt,
    TimeOnly? ClosingAt,
    bool IsClosed);
