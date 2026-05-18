using app.Models;
using app.Models.Admin;
using domain.Entities;

namespace app.Abstractions.Administration;

public interface IAdminLocationService
{
    Task<IReadOnlyList<Location>> ListAsync(CancellationToken cancellationToken = default);

    Task<Location?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceResult<Location>> CreateAsync(
        LocationAdminCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<Location>> UpdateAsync(
        Guid id,
        LocationAdminUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
