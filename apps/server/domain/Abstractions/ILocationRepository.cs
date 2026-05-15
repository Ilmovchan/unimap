using domain.Entities;

namespace Unimap.Domain.Abstractions;

public interface ILocationRepository
{
    Task<IReadOnlyList<Location>> GetAllForMapAsync(CancellationToken cancellationToken = default);

    Task<Location?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
