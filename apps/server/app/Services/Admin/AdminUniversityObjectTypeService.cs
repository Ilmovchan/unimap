using app.Abstractions;
using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminUniversityObjectTypeService(
    IAdminUniversityObjectTypeRepository repository,
    IUserApiCacheInvalidator cacheInvalidator) : IAdminUniversityObjectTypeService
{
    public Task<IReadOnlyList<UniversityObjectType>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<UniversityObjectType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<UniversityObjectType>> CreateAsync(
        UniversityObjectTypeAdminCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Code) || string.IsNullOrWhiteSpace(command.TitleUk))
            return ServiceResult<UniversityObjectType>.Fail("code and titleUk are required.");

        var entity = new UniversityObjectType
        {
            Id = command.Id ?? Guid.Empty,
            Code = command.Code.Trim(),
            TitleUk = command.TitleUk.Trim(),
        };

        await repository.AddAsync(entity, cancellationToken);
        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<UniversityObjectType>.Ok(entity);
    }

    public async Task<ServiceResult<UniversityObjectType>> UpdateAsync(
        Guid id,
        UniversityObjectTypeAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        var updated = await repository.UpdateAsync(
            id,
            entity =>
            {
                if (!string.IsNullOrWhiteSpace(command.Code))
                    entity.Code = command.Code.Trim();
                if (!string.IsNullOrWhiteSpace(command.TitleUk))
                    entity.TitleUk = command.TitleUk.Trim();
            },
            cancellationToken);

        if (updated is null)
            return ServiceResults.NotFound<UniversityObjectType>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<UniversityObjectType>.Ok(updated);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await repository.TryDeleteByIdAsync(id, cancellationToken);
        if (!deleted)
        {
            var exists = await repository.GetByIdAsync(id, cancellationToken);
            if (exists is null)
                return ServiceResults.NotFound<bool>();
            return ServiceResults.Conflict<bool>(
                "Cannot delete: university objects reference this type.");
        }

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }
}
