using domain.Entities;

namespace domain.Abstractions.Admin;

public interface IAdminLocationPhotoRepository
{
    Task<IReadOnlyList<LocationPhoto>> ListByLocationIdAsync(
        Guid locationId,
        CancellationToken cancellationToken = default);

    Task<bool> StorageKeyExistsAsync(string storageKey, CancellationToken cancellationToken = default);

    Task<bool> LocationHasPhotosAsync(Guid locationId, CancellationToken cancellationToken = default);

    Task AddAsync(LocationPhoto photo, bool clearOtherMainFlags, CancellationToken cancellationToken = default);

    Task<LocationPhoto?> UpdateAsync(
        Guid locationId,
        Guid photoId,
        Action<LocationPhoto> applyChanges,
        bool clearOtherMainFlags,
        CancellationToken cancellationToken = default);

    Task<LocationPhoto?> DeleteAsync(
        Guid locationId,
        Guid photoId,
        CancellationToken cancellationToken = default);
}
