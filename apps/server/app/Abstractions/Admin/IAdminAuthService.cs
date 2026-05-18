using app.Models;
using app.Models.Admin;
using AdminEntity = domain.Entities.Admin;

namespace app.Abstractions.Administration;

public interface IAdminAuthService
{
    Task<ServiceResult<AdminEntity>> LoginAsync(
        AdminLoginCommand command,
        CancellationToken cancellationToken = default);
}
