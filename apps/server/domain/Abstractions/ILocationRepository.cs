using domain.Entities;
using domain.Models;

namespace Unimap.Domain.Abstractions;

public interface ILocationRepository
{
    Task<IReadOnlyList<LocationMarker>> GetMarkersAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Location>> GetAllWithDetailsAsync(
        CancellationToken cancellationToken = default);

    Task<Location?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
