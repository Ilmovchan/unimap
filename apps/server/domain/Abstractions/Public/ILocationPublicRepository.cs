using domain.Dto;
using domain.Entities;

namespace domain.Abstractions.Public;

public interface ILocationPublicRepository
{
    Task<IReadOnlyList<LocationMarkerDto>> GetMarkersAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Location>> GetAllWithDetailsAsync(
        CancellationToken cancellationToken = default);

    Task<Location?> GetByIdWithDetailsAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}
