using app.Abstractions;
using app.Caching;

namespace infrastructure.Caching;

public sealed class UserApiCacheInvalidator(IUserApiCache cache) : IUserApiCacheInvalidator
{
    public Task InvalidateLocationsAsync(CancellationToken cancellationToken = default) =>
        cache.RemoveByPrefixAsync(UserApiCacheKeys.LocationsPrefix, cancellationToken);

    public Task InvalidateLocationDetailAsync(Guid locationId, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(UserApiCacheKeys.LocationDetail(locationId), cancellationToken);

    public Task InvalidateNewsAsync(CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(UserApiCacheKeys.NewsActive(), cancellationToken);

    public Task InvalidateNavigationAsync(CancellationToken cancellationToken = default) =>
        cache.RemoveByPrefixAsync(UserApiCacheKeys.Prefix + "navigation:", cancellationToken);
}
