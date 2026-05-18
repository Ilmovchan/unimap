namespace domain.Dto;

public sealed record LocationMarkerDto(
    Guid Id,
    double Latitude,
    double Longitude,
    string MarkerKey);
