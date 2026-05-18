using domain.Abstractions.Admin;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Admin;

public sealed class AdminLocationPhotoRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : IAdminLocationPhotoRepository
{
    public async Task<IReadOnlyList<LocationPhoto>> ListByLocationIdAsync(
        Guid locationId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationPhotos
            .AsNoTracking()
            .Where(x => x.LocationId == locationId)
            .OrderByDescending(x => x.IsMain)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> StorageKeyExistsAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationPhotos.AnyAsync(x => x.StorageKey == storageKey, cancellationToken);
    }

    public async Task<bool> LocationHasPhotosAsync(
        Guid locationId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationPhotos.AnyAsync(x => x.LocationId == locationId, cancellationToken);
    }

    public async Task AddAsync(
        LocationPhoto photo,
        bool clearOtherMainFlags,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        if (clearOtherMainFlags)
            await ClearMainFlagsAsync(db, photo.LocationId, exceptPhotoId: null, cancellationToken);

        db.LocationPhotos.Add(photo);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<LocationPhoto?> UpdateAsync(
        Guid locationId,
        Guid photoId,
        Action<LocationPhoto> applyChanges,
        bool clearOtherMainFlags,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var photo = await db.LocationPhotos
            .FirstOrDefaultAsync(x => x.Id == photoId && x.LocationId == locationId, cancellationToken);
        if (photo is null)
            return null;

        if (clearOtherMainFlags)
            await ClearMainFlagsAsync(db, locationId, photoId, cancellationToken);

        applyChanges(photo);
        await db.SaveChangesAsync(cancellationToken);
        return photo;
    }

    public async Task<LocationPhoto?> DeleteAsync(
        Guid locationId,
        Guid photoId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var photo = await db.LocationPhotos
            .FirstOrDefaultAsync(x => x.Id == photoId && x.LocationId == locationId, cancellationToken);
        if (photo is null)
            return null;

        db.LocationPhotos.Remove(photo);
        await db.SaveChangesAsync(cancellationToken);
        return photo;
    }

    private static async Task ClearMainFlagsAsync(
        UniMapDbContext db,
        Guid locationId,
        Guid? exceptPhotoId,
        CancellationToken cancellationToken)
    {
        var others = await db.LocationPhotos
            .Where(x => x.LocationId == locationId && x.IsMain)
            .Where(x => exceptPhotoId == null || x.Id != exceptPhotoId)
            .ToListAsync(cancellationToken);

        foreach (var item in others)
            item.IsMain = false;
    }
}
