using domain.Entities;
using Microsoft.EntityFrameworkCore;
using Unimap.Domain.Abstractions;

namespace persistence.Repositories;

public sealed class LocationRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : ILocationRepository
{
    public async Task<IReadOnlyList<Location>> GetAllForMapAsync(
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory
            .CreateDbContextAsync(cancellationToken);

        return await context.Locations
            .AsNoTracking()
            .Include(l => l.LocationType)
            .Include(l => l.UniversityObjects.OrderBy(o => o.Title))
            .ThenInclude(o => o.ObjectType)
            .OrderBy(x => x.Latitude)
            .ThenBy(x => x.Longitude)
            .ToListAsync(cancellationToken);
    }

    public async Task<Location?> GetByIdWithDetailsAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory
            .CreateDbContextAsync(cancellationToken);

        return await context.Locations
            .AsNoTracking()
            .Include(l => l.LocationType)
            .Include(l => l.UniversityObjects.OrderBy(o => o.Title))
            .ThenInclude(o => o.ObjectType)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }
}
