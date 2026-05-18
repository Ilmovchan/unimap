using app.Models;
using app.Models.Admin;
using domain.Entities;

namespace app.Abstractions.Administration;

public interface IAdminUniversityObjectService
{
    Task<IReadOnlyList<UniversityObject>> ListAsync(CancellationToken cancellationToken = default);

    Task<UniversityObject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceResult<UniversityObject>> CreateAsync(
        UniversityObjectAdminCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<UniversityObject>> UpdateAsync(
        Guid id,
        UniversityObjectAdminUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
