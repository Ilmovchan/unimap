using domain.Abstractions.Admin;
using AdminEntity = domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Admin;

public sealed class AdminAccountRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : IAdminAccountRepository
{
    public async Task<IReadOnlyList<AdminEntity>> ListAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Admins
            .AsNoTracking()
            .OrderBy(x => x.Email)
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Admins.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<AdminEntity?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Admins.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
    }

    public async Task<bool> UsernameExistsAsync(
        string username,
        Guid? exceptId = null,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Admins.AnyAsync(
            x => x.Username == username && (exceptId == null || x.Id != exceptId),
            cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(
        string email,
        Guid? exceptId = null,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await db.Admins.AnyAsync(
            x => x.Email == email && (exceptId == null || x.Id != exceptId),
            cancellationToken);
    }

    public async Task AddAsync(AdminEntity entity, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        db.Admins.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<AdminEntity?> UpdateAsync(
        Guid id,
        Action<AdminEntity> applyChanges,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Admins.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return null;

        applyChanges(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Admins.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return false;

        db.Admins.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task RecordLoginAsync(
        Guid adminId,
        DateTimeOffset loggedInAt,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        var admin = await db.Admins.FirstOrDefaultAsync(x => x.Id == adminId, cancellationToken);
        if (admin is null)
            return;

        admin.LastLoginAt = loggedInAt;
        await db.SaveChangesAsync(cancellationToken);
    }
}
