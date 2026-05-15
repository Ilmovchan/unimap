using domain.Entities;
using Microsoft.EntityFrameworkCore;
using Unimap.Domain.Abstractions;

namespace persistence.Repositories;

public sealed class NewsRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : INewsRepository
{
    public async Task<IReadOnlyList<News>> GetActiveAsync(
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory
            .CreateDbContextAsync(cancellationToken);

        return await context.News
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
