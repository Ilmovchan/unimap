using domain.Abstractions.Public;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Public;

public sealed class NewsPublicRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : INewsPublicRepository
{
    public async Task<IReadOnlyList<News>> GetActiveAsync(
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync(cancellationToken);

        return await context.News
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
