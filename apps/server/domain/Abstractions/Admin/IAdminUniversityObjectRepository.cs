using domain.Entities;

namespace domain.Abstractions.Admin;

public interface IAdminUniversityObjectRepository
{
    Task<IReadOnlyList<UniversityObject>> ListAsync(CancellationToken cancellationToken = default);

    Task<UniversityObject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> LocationExistsAsync(Guid locationId, CancellationToken cancellationToken = default);

    Task<bool> ObjectTypeExistsAsync(Guid objectTypeId, CancellationToken cancellationToken = default);

    Task AddAsync(UniversityObject entity, CancellationToken cancellationToken = default);

    Task<UniversityObject?> UpdateAsync(
        Guid id,
        Action<UniversityObject> applyChanges,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
