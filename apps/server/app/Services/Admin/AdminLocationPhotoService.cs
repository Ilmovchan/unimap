using app.Abstractions.Administration;
using app.Models;
using app.Models.Admin;
using domain;
using domain.Abstractions;
using domain.Abstractions.Admin;
using domain.Entities;

namespace app.Services.Administration;

public sealed class AdminLocationPhotoService(
    IAdminLocationRepository locationRepository,
    IAdminLocationPhotoRepository photoRepository,
    IPictureProvider pictureProvider) : IAdminLocationPhotoService
{
    private const long MaxUploadBytes = 10 * 1024 * 1024;

    public async Task<ServiceResult<IReadOnlyList<LocationPhoto>>> ListAsync(
        Guid locationId,
        CancellationToken cancellationToken = default)
    {
        if (!await locationRepository.ExistsAsync(locationId, cancellationToken))
            return ServiceResults.NotFound<IReadOnlyList<LocationPhoto>>();

        var photos = await photoRepository.ListByLocationIdAsync(locationId, cancellationToken);
        return ServiceResult<IReadOnlyList<LocationPhoto>>.Ok(photos);
    }

    public async Task<ServiceResult<LocationPhoto>> UploadAsync(
        Guid locationId,
        LocationPhotoAdminUploadCommand command,
        CancellationToken cancellationToken = default)
    {
        if (command.Length == 0)
            return ServiceResult<LocationPhoto>.Fail("file is required.");

        if (command.Length > MaxUploadBytes)
            return ServiceResult<LocationPhoto>.Fail("file exceeds 10 MB limit.");

        if (!IsAllowedImageContentType(command.ContentType))
            return ServiceResult<LocationPhoto>.Fail("only image files are allowed.");

        if (!await locationRepository.ExistsAsync(locationId, cancellationToken))
            return ServiceResults.NotFound<LocationPhoto>();

        var storageKey = LocationPhotoStorageKeys.ForLocation(locationId, command.FileName);
        if (await photoRepository.StorageKeyExistsAsync(storageKey, cancellationToken))
        {
            storageKey = LocationPhotoStorageKeys.ForLocation(
                locationId,
                $"{Guid.NewGuid():N}{Path.GetExtension(command.FileName)}");
        }

        await pictureProvider.SaveAsync(
            storageKey,
            command.Content,
            command.ContentType,
            cancellationToken);

        var setMain = command.IsMain == true;
        var hasAnyPhoto = await photoRepository.LocationHasPhotosAsync(locationId, cancellationToken);
        var photo = new LocationPhoto
        {
            Id = Guid.NewGuid(),
            LocationId = locationId,
            StorageKey = storageKey,
            ImageUrl = string.Empty,
            AltUk = string.IsNullOrWhiteSpace(command.AltUk) ? null : command.AltUk.Trim(),
            IsMain = setMain || !hasAnyPhoto,
        };

        await photoRepository.AddAsync(photo, setMain, cancellationToken);
        return ServiceResult<LocationPhoto>.Ok(photo);
    }

    public async Task<ServiceResult<LocationPhoto>> UpdateAsync(
        Guid locationId,
        Guid photoId,
        LocationPhotoAdminUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        var clearOthers = command.IsMain == true;
        var updated = await photoRepository.UpdateAsync(
            locationId,
            photoId,
            photo =>
            {
                if (command.AltUk is not null)
                    photo.AltUk = string.IsNullOrWhiteSpace(command.AltUk) ? null : command.AltUk.Trim();

                if (command.IsMain == true)
                    photo.IsMain = true;
                else if (command.IsMain == false && photo.IsMain)
                    photo.IsMain = false;
            },
            clearOthers,
            cancellationToken);

        return updated is null
            ? ServiceResults.NotFound<LocationPhoto>()
            : ServiceResult<LocationPhoto>.Ok(updated);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid locationId,
        Guid photoId,
        CancellationToken cancellationToken = default)
    {
        var photo = await photoRepository.DeleteAsync(locationId, photoId, cancellationToken);
        if (photo is null)
            return ServiceResults.NotFound<bool>();

        if (!string.IsNullOrWhiteSpace(photo.StorageKey))
            await pictureProvider.DeleteAsync(photo.StorageKey, cancellationToken);

        return ServiceResult<bool>.Ok(true);
    }

    private static bool IsAllowedImageContentType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType)
        && contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
}
