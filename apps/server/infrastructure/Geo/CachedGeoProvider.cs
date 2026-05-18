using app.Abstractions;
using app.Caching;
using Microsoft.Extensions.Options;

namespace infrastructure.Geo;

public sealed class CachedGeoProvider(
    NominatimGeoProvider inner,
    IUserApiCache cache,
    IOptions<UserApiCacheOptions> options) : IGeoProvider
{
    public async Task<string> GeoReverse(double lat, double lng)
    {
        var key = UserApiCacheKeys.NavigationReverse(lat, lng);
        var cached = await cache.GetAsync<string>(key);
        if (!string.IsNullOrEmpty(cached))
            return cached;

        var addressJson = await inner.GeoReverse(lat, lng);
        await cache.SetAsync(
            key,
            addressJson,
            TimeSpan.FromMinutes(options.Value.NavigationTtlMinutes));
        return addressJson;
    }
}
