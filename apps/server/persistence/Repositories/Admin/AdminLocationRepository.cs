using domain.Abstractions.Admin;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Admin;

public sealed class AdminLocationRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : IAdminLocationRepository
{
    public async Task<IReadOnlyList<Location>> ListAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Locations
            .AsNoTracking()
            .Include(x => x.LocationType)
            .Include(x => x.Photos)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);
    }

    public async Task<Location?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Locations
            .AsNoTracking()
            .Include(x => x.LocationType)
            .Include(x => x.Photos)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Locations.AnyAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<bool> LocationTypeExistsAsync(
        Guid locationTypeId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationTypes.AnyAsync(x => x.Id == locationTypeId, cancellationToken);
    }

    public async Task AddAsync(Location location, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        db.Locations.Add(location);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Location?> UpdateAsync(
        Guid id,
        Action<Location> applyChanges,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Locations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return null;

        applyChanges(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Locations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return false;

        db.Locations.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
