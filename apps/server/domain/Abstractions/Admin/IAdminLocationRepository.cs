using domain.Entities;

namespace domain.Abstractions.Admin;

public interface IAdminLocationRepository
{
    Task<IReadOnlyList<Location>> ListAsync(CancellationToken cancellationToken = default);

    Task<Location?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> LocationTypeExistsAsync(Guid locationTypeId, CancellationToken cancellationToken = default);

    Task AddAsync(Location location, CancellationToken cancellationToken = default);

    Task<Location?> UpdateAsync(
        Guid id,
        Action<Location> applyChanges,
        CancellationToken cancellationToken = default);

    Task ReplaceScheduleAsync(
        Guid locationId,
        IReadOnlyList<Schedule> schedule,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
