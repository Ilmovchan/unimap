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
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> StorageKeyExistsAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationPhotos.AnyAsync(x => x.StorageKey == storageKey, cancellationToken);
    }

    public async Task AddAsync(
        LocationPhoto photo,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        db.LocationPhotos.Add(photo);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<LocationPhoto?> UpdateAsync(
        Guid locationId,
        Guid photoId,
        Action<LocationPhoto> applyChanges,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var photo = await db.LocationPhotos
            .FirstOrDefaultAsync(x => x.Id == photoId && x.LocationId == locationId, cancellationToken);
        if (photo is null)
            return null;

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
}
