using Microsoft.EntityFrameworkCore;
using persistence;
using Unimap.Domain.Abstractions;
using Unimap.Domain.Entities;

namespace Unimap.Persistence.Repositories;

public sealed class DepartmentRepository(
    IDbContextFactory<UniMapDbContext> dbContextFactory) : IDepartmentRepository
{
    public async Task<IReadOnlyList<Department>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory
            .CreateDbContextAsync(cancellationToken);

        return await context.Departments
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Department?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory
            .CreateDbContextAsync(cancellationToken);

        return await context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }
}

