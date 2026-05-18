using AdminEntity = domain.Entities.Admin;

namespace domain.Abstractions.Admin;

public interface IAdminAccountRepository
{
    Task<IReadOnlyList<AdminEntity>> ListAsync(CancellationToken cancellationToken = default);

    Task<AdminEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<AdminEntity?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> UsernameExistsAsync(
        string username,
        Guid? exceptId = null,
        CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(
        string email,
        Guid? exceptId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(AdminEntity entity, CancellationToken cancellationToken = default);

    Task<AdminEntity?> UpdateAsync(
        Guid id,
        Action<AdminEntity> applyChanges,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task RecordLoginAsync(Guid adminId, DateTimeOffset loggedInAt, CancellationToken cancellationToken = default);
}
