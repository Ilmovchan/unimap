using domain.Abstractions.Admin;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Admin;

public sealed class AdminLocationTypeRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : IAdminLocationTypeRepository
{
    public async Task<IReadOnlyList<LocationType>> ListAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationTypes
            .AsNoTracking()
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);
    }

    public async Task<LocationType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.LocationTypes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task AddAsync(LocationType entity, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        db.LocationTypes.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<LocationType?> UpdateAsync(
        Guid id,
        Action<LocationType> applyChanges,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.LocationTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return null;

        applyChanges(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> TryDeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.LocationTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return false;

        db.LocationTypes.Remove(entity);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            return false;
        }
    }
}
