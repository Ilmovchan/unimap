using app.Abstractions;
using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminLocationService(
    IAdminLocationRepository repository,
    IUserApiCacheInvalidator cacheInvalidator) : IAdminLocationService
{
    public Task<IReadOnlyList<Location>> ListAsync(CancellationToken cancellationToken = default) =>
        repository.ListAsync(cancellationToken);

    public Task<Location?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<ServiceResult<Location>> CreateAsync(
        LocationAdminCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.LocationTypeId == Guid.Empty || string.IsNullOrWhiteSpace(command.Title))
            return ServiceResult<Location>.Fail("locationTypeId and title are required.");

        if (!await repository.LocationTypeExistsAsync(command.LocationTypeId, cancellationToken))
            return ServiceResult<Location>.Fail("locationTypeId does not exist.");

        var entity = new Location
        {
            Id = command.Id ?? Guid.Empty,
            LocationTypeId = command.LocationTypeId,
            Title = command.Title.Trim(),
            Latitude = command.Latitude ?? 0,
            Longitude = command.Longitude ?? 0,
            Description = command.Description,
            AddressJson = command.AddressJson,
        };

        await repository.AddAsync(entity, cancellationToken);
        var created = await repository.GetByIdAsync(entity.Id, cancellationToken);
        if (created is null)
            return ServiceResults.NotFound<Location>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<Location>.Ok(created);
    }

    public async Task<ServiceResult<Location>> UpdateAsync(
        Guid id,
        LocationAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.LocationTypeId != Guid.Empty
            && !await repository.LocationTypeExistsAsync(command.LocationTypeId, cancellationToken))
        {
            return ServiceResult<Location>.Fail("locationTypeId does not exist.");
        }

        var updated = await repository.UpdateAsync(
            id,
            entity =>
            {
                if (command.LocationTypeId != Guid.Empty)
                    entity.LocationTypeId = command.LocationTypeId;
                if (!string.IsNullOrWhiteSpace(command.Title))
                    entity.Title = command.Title.Trim();
                if (command.Latitude.HasValue)
                    entity.Latitude = command.Latitude.Value;
                if (command.Longitude.HasValue)
                    entity.Longitude = command.Longitude.Value;
                if (command.Description is not null)
                    entity.Description = command.Description;
                if (command.AddressJson is not null)
                    entity.AddressJson = command.AddressJson;
            },
            cancellationToken);

        if (updated is null)
            return ServiceResults.NotFound<Location>();

        var withDetails = await repository.GetByIdAsync(id, cancellationToken);
        if (withDetails is null)
            return ServiceResults.NotFound<Location>();

        await cacheInvalidator.InvalidateLocationsAsync(cancellationToken);
        return ServiceResult<Location>.Ok(withDetails);
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
}
