using domain.Entities;

namespace domain.Abstractions.Admin;

public interface IAdminNewsRepository
{
    Task<IReadOnlyList<News>> ListAsync(CancellationToken cancellationToken = default);

    Task<News?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(News entity, CancellationToken cancellationToken = default);

    Task<News?> UpdateAsync(
        Guid id,
        Action<News> applyChanges,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
