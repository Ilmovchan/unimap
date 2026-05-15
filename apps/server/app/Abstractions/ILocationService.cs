using domain.Entities;

namespace app.Abstractions;

public interface ILocationService
{
    Task<IReadOnlyList<Location>> GetLocationsForMapAsync(CancellationToken cancellationToken = default);

    Task<Location?> GetLocationByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
