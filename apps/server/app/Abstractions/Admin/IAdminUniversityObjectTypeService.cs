using app.Models;
using app.Models.Admin;
using domain.Entities;

namespace app.Abstractions.Administration;

public interface IAdminUniversityObjectTypeService
{
    Task<IReadOnlyList<UniversityObjectType>> ListAsync(CancellationToken cancellationToken = default);

    Task<UniversityObjectType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceResult<UniversityObjectType>> CreateAsync(
        UniversityObjectTypeAdminCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<UniversityObjectType>> UpdateAsync(
        Guid id,
        UniversityObjectTypeAdminUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
