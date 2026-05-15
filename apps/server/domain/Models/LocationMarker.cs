namespace domain.Models;

public sealed record LocationMarker(
    Guid Id,
    double Latitude,
    double Longitude,
    string MarkerKey);
