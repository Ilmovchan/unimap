using app.Abstractions;
using app.Caching;
using domain.Dto;
using domain.Entities;
using Microsoft.Extensions.Options;

namespace app.Services.Caching;

public sealed class CachedLocationService(
    LocationService inner,
    IUserApiCache cache,
    IOptions<UserApiCacheOptions> options) : ILocationService
{
    public async Task<IReadOnlyList<LocationMarkerDto>> GetLocationMarkersAsync(
        CancellationToken cancellationToken = default)
    {
        var key = UserApiCacheKeys.LocationMarkers();
        var cached = await cache.GetAsync<List<LocationMarkerDto>>(key, cancellationToken);
        if (cached is not null)
            return cached;

        var markers = await inner.GetLocationMarkersAsync(cancellationToken);
        await cache.SetAsync(
            key,
            markers.ToList(),
            TimeSpan.FromMinutes(options.Value.LocationsTtlMinutes),
            cancellationToken);
        return markers;
    }

    public async Task<IReadOnlyList<Location>> GetLocationsListAsync(
        CancellationToken cancellationToken = default)
    {
        var key = UserApiCacheKeys.LocationsList();
        var cached = await cache.GetAsync<List<Location>>(key, cancellationToken);
        if (cached is not null)
            return cached;

        var locations = await inner.GetLocationsListAsync(cancellationToken);
        await cache.SetAsync(
            key,
            locations.ToList(),
            TimeSpan.FromMinutes(options.Value.LocationsTtlMinutes),
            cancellationToken);
        return locations;
    }

    public async Task<Location?> GetLocationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var key = UserApiCacheKeys.LocationDetail(id);
        var cached = await cache.GetAsync<Location>(key, cancellationToken);
        if (cached is not null)
            return cached;

        var location = await inner.GetLocationByIdAsync(id, cancellationToken);
        if (location is null)
            return null;

        await cache.SetAsync(
            key,
            location,
            TimeSpan.FromMinutes(options.Value.LocationsTtlMinutes),
            cancellationToken);
        return location;
    }
}
