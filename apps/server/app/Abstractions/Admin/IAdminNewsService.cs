using app.Models;
using app.Models.Admin;
using domain.Entities;

namespace app.Abstractions.Administration;

public interface IAdminNewsService
{
    Task<IReadOnlyList<News>> ListAsync(CancellationToken cancellationToken = default);

    Task<News?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceResult<News>> CreateAsync(
        NewsAdminCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<News>> UpdateAsync(
        Guid id,
        NewsAdminUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
