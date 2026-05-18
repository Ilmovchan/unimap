using domain.Dto;
using domain.Entities;

namespace app.Abstractions;

public interface ILocationService
{
    Task<IReadOnlyList<LocationMarkerDto>> GetLocationMarkersAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Location>> GetLocationsListAsync(
        CancellationToken cancellationToken = default);

    Task<Location?> GetLocationByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
