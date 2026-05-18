using app.Abstractions;
using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminNewsService(
    IAdminNewsRepository repository,
    IUserApiCacheInvalidator cacheInvalidator) : IAdminNewsService
{
    public Task<IReadOnlyList<News>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<News?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<News>> CreateAsync(
        NewsAdminCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Title) || string.IsNullOrWhiteSpace(command.Content))
            return ServiceResult<News>.Fail("title and content are required.");

        var entity = new News
        {
            Id = command.Id ?? Guid.Empty,
            Title = command.Title.Trim(),
            Content = command.Content,
            IsActive = command.IsActive ?? true,
        };

        await repository.AddAsync(entity, cancellationToken);
        await cacheInvalidator.InvalidateNewsAsync(cancellationToken);
        return ServiceResult<News>.Ok(entity);
    }

    public async Task<ServiceResult<News>> UpdateAsync(
        Guid id,
        NewsAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        var updated = await repository.UpdateAsync(
            id,
            entity =>
            {
                if (!string.IsNullOrWhiteSpace(command.Title))
                    entity.Title = command.Title.Trim();
                if (!string.IsNullOrWhiteSpace(command.Content))
                    entity.Content = command.Content;
                if (command.IsActive.HasValue)
                    entity.IsActive = command.IsActive.Value;
            },
            cancellationToken);

        if (updated is null)
            return ServiceResults.NotFound<News>();

        await cacheInvalidator.InvalidateNewsAsync(cancellationToken);
        return ServiceResult<News>.Ok(updated);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteByIdAsync(id, cancellationToken);
        if (!deleted)
            return ServiceResults.NotFound<bool>();

        await cacheInvalidator.InvalidateNewsAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }
}
