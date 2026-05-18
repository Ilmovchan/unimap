using app.Models;
using app.Models.Admin;
using domain.Entities;

namespace app.Abstractions.Administration;

public interface IAdminLocationPhotoService
{
    Task<ServiceResult<IReadOnlyList<LocationPhoto>>> ListAsync(
        Guid locationId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<LocationPhoto>> UploadAsync(
        Guid locationId,
        LocationPhotoAdminUploadCommand command,
        string? requestBaseUrl,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<LocationPhoto>> UpdateAsync(
        Guid locationId,
        Guid photoId,
        LocationPhotoAdminUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(
        Guid locationId,
        Guid photoId,
        CancellationToken cancellationToken = default);
}
