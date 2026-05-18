using app.Models;
using app.Models.Admin;
using AdminEntity = domain.Entities.Admin;

namespace app.Abstractions.Administration;

public interface IAdminAccountService
{
    Task<IReadOnlyList<AdminEntity>> ListAsync(CancellationToken cancellationToken = default);

    Task<AdminEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminEntity>> CreateAsync(
        AdminAccountCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminEntity>> UpdateAsync(
        Guid id,
        AdminAccountUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        Guid currentAdminId,
        CancellationToken cancellationToken = default);
}
