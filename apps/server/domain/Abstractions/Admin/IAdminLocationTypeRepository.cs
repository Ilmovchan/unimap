using domain.Entities;

namespace domain.Abstractions.Admin;

public interface IAdminLocationTypeRepository
{
    Task<IReadOnlyList<LocationType>> ListAsync(CancellationToken cancellationToken = default);

    Task<LocationType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(LocationType entity, CancellationToken cancellationToken = default);

    Task<LocationType?> UpdateAsync(
        Guid id,
        Action<LocationType> applyChanges,
        CancellationToken cancellationToken = default);

    Task<bool> TryDeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
