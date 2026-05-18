using domain.Entities;

namespace domain.Abstractions.Admin;

public interface IAdminUniversityObjectTypeRepository
{
    Task<IReadOnlyList<UniversityObjectType>> ListAsync(CancellationToken cancellationToken = default);

    Task<UniversityObjectType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(UniversityObjectType entity, CancellationToken cancellationToken = default);

    Task<UniversityObjectType?> UpdateAsync(
        Guid id,
        Action<UniversityObjectType> applyChanges,
        CancellationToken cancellationToken = default);

    Task<bool> TryDeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
