using app.Models;
using app.Models.Admin;
using domain.Entities;

namespace app.Abstractions.Administration;

public interface IAdminLocationTypeService
{
    Task<IReadOnlyList<LocationType>> ListAsync(CancellationToken cancellationToken = default);

    Task<LocationType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceResult<LocationType>> CreateAsync(
        LocationTypeAdminCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<LocationType>> UpdateAsync(
        Guid id,
        LocationTypeAdminUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
