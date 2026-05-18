using domain;
using domain.Abstractions.Public;
using domain.Dto;
using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence.Repositories.Public;

public sealed class LocationPublicRepository(IDbContextFactory<UniMapDbContext> dbContextFactory)
    : ILocationPublicRepository
{
    public async Task<IReadOnlyList<LocationMarkerDto>> GetMarkersAsync(
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync(cancellationToken);

        var locations = await context.Locations
            .AsNoTracking()
            .Include(x => x.LocationType)
            .OrderBy(x => x.Latitude)
            .ThenBy(x => x.Longitude)
            .ToListAsync(cancellationToken);

        return locations
            .Select(x => new LocationMarkerDto(
                x.Id,
                x.Latitude,
                x.Longitude,
                LocationTypeMarkerResolver.Resolve(x.LocationType)))
            .ToList();
    }

    public async Task<IReadOnlyList<Location>> GetAllWithDetailsAsync(
        CancellationToken cancellationToken = default)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync(cancellationToken);

        return await context.Locations
            .AsNoTracking()
            .Include(l => l.LocationType)
            .Include(l => l.Photos)
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
        await using var context = await dbContextFactory.CreateDbContextAsync(cancellationToken);

        return await context.Locations
            .AsNoTracking()
            .Include(l => l.LocationType)
            .Include(l => l.Photos)
            .Include(l => l.UniversityObjects.OrderBy(o => o.Title))
            .ThenInclude(o => o.ObjectType)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }
}
