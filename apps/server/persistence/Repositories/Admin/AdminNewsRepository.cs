using domain.Abstractions.Admin;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Admin;

public sealed class AdminNewsRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : IAdminNewsRepository
{
    public async Task<IReadOnlyList<News>> ListAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.News
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<News?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.News.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task AddAsync(News entity, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        db.News.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<News?> UpdateAsync(
        Guid id,
        Action<News> applyChanges,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.News.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return null;

        applyChanges(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.News.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return false;

        db.News.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
