using domain.Entities;
using domain.Models;

namespace app.Abstractions;

public interface ILocationService
{
    Task<IReadOnlyList<LocationMarker>> GetLocationMarkersAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Location>> GetLocationsListAsync(
        CancellationToken cancellationToken = default);

    Task<Location?> GetLocationByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
