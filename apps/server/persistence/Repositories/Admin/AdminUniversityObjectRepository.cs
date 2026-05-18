using domain.Abstractions.Admin;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Admin;

public sealed class AdminUniversityObjectRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : IAdminUniversityObjectRepository
{
    public async Task<IReadOnlyList<UniversityObject>> ListAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.UniversityObjects
            .AsNoTracking()
            .Include(x => x.Location)
            .Include(x => x.ObjectType)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);
    }

    public async Task<UniversityObject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.UniversityObjects
            .AsNoTracking()
            .Include(x => x.Location)
            .Include(x => x.ObjectType)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<bool> LocationExistsAsync(Guid locationId, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Locations.AnyAsync(x => x.Id == locationId, cancellationToken);
    }

    public async Task<bool> ObjectTypeExistsAsync(Guid objectTypeId, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.UniversityObjectTypes.AnyAsync(x => x.Id == objectTypeId, cancellationToken);
    }

    public async Task AddAsync(UniversityObject entity, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        db.UniversityObjects.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<UniversityObject?> UpdateAsync(
        Guid id,
        Action<UniversityObject> applyChanges,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjects.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return null;

        applyChanges(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjects.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return false;

        db.UniversityObjects.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
