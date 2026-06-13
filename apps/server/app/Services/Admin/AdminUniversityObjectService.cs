using app.Abstractions;
using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminUniversityObjectService(
    IAdminUniversityObjectRepository repository,
    IUserApiCacheInvalidator cacheInvalidator) : IAdminUniversityObjectService
{
    public Task<IReadOnlyList<UniversityObject>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<UniversityObject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<UniversityObject>> CreateAsync(
        UniversityObjectAdminCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.LocationId == Guid.Empty
            || command.ObjectTypeId == Guid.Empty
            || string.IsNullOrWhiteSpace(command.Title))
        {
            return ServiceResult<UniversityObject>.Fail("locationId, objectTypeId and title are required.");
        }

        if (!await repository.LocationExistsAsync(command.LocationId, cancellationToken))
            return ServiceResult<UniversityObject>.Fail("locationId does not exist.");

        if (!await repository.ObjectTypeExistsAsync(command.ObjectTypeId, cancellationToken))
            return ServiceResult<UniversityObject>.Fail("objectTypeId does not exist.");

        var entity = new UniversityObject
        {
            Id = command.Id ?? Guid.Empty,
            LocationId = command.LocationId,
            ObjectTypeId = command.ObjectTypeId,
            Title = command.Title.Trim(),
            Description = NormalizeOptionalText(command.Description),
            Manager = string.IsNullOrWhiteSpace(command.Manager)
                ? null
                : command.Manager.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(command.PhoneNumber)
                ? null
                : command.PhoneNumber.Trim(),
            WebUrl = string.IsNullOrWhiteSpace(command.WebUrl)
                ? null
                : command.WebUrl.Trim(),
        };

        await repository.AddAsync(entity, cancellationToken);
        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<UniversityObject>.Ok(entity);
    }

    public async Task<ServiceResult<UniversityObject>> UpdateAsync(
        Guid id,
        UniversityObjectAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.LocationId != Guid.Empty
            && !await repository.LocationExistsAsync(command.LocationId, cancellationToken))
        {
            return ServiceResult<UniversityObject>.Fail("locationId does not exist.");
        }

        if (command.ObjectTypeId != Guid.Empty
            && !await repository.ObjectTypeExistsAsync(command.ObjectTypeId, cancellationToken))
        {
            return ServiceResult<UniversityObject>.Fail("objectTypeId does not exist.");
        }

        var updated = await repository.UpdateAsync(
            id,
            entity =>
            {
                if (command.LocationId != Guid.Empty)
                    entity.LocationId = command.LocationId;
                if (command.ObjectTypeId != Guid.Empty)
                    entity.ObjectTypeId = command.ObjectTypeId;
                if (!string.IsNullOrWhiteSpace(command.Title))
                    entity.Title = command.Title.Trim();
                entity.Description = NormalizeOptionalText(command.Description);
                entity.Manager = string.IsNullOrWhiteSpace(command.Manager)
                    ? null
                    : command.Manager.Trim();
                entity.PhoneNumber = string.IsNullOrWhiteSpace(command.PhoneNumber)
                    ? null
                    : command.PhoneNumber.Trim();
                entity.WebUrl = string.IsNullOrWhiteSpace(command.WebUrl)
                    ? null
                    : command.WebUrl.Trim();
            },
            cancellationToken);

        if (updated is null)
            return ServiceResults.NotFound<UniversityObject>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<UniversityObject>.Ok(updated);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteByIdAsync(id, cancellationToken);
        if (!deleted)
            return ServiceResults.NotFound<bool>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
