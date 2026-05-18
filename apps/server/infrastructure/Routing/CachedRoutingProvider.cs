using app.Abstractions;
using app.Caching;
using Microsoft.Extensions.Options;

namespace infrastructure.Routing;

public sealed class CachedRoutingProvider(
    OpenRouteServiceRoutingProvider inner,
    IUserApiCache cache,
    IOptions<UserApiCacheOptions> options) : IRoutingProvider
{
    public async Task<OpenRouteResponse?> NavigateAsync(
        double startLat,
        double startLng,
        double endLat,
        double endLng,
        string profile = "")
    {
        var profileSegment = string.IsNullOrWhiteSpace(profile) ? "foot-walking" : profile.Trim();
        var key = UserApiCacheKeys.NavigationRoute(profileSegment, startLat, startLng, endLat, endLng);
        var cached = await cache.GetAsync<OpenRouteResponse>(key);
        if (cached is not null)
            return cached;

        var route = await inner.NavigateAsync(startLat, startLng, endLat, endLng, profile);
        if (route is not null)
        {
            await cache.SetAsync(
                key,
                route,
                TimeSpan.FromMinutes(options.Value.NavigationTtlMinutes));
        }

        return route;
    }
}
