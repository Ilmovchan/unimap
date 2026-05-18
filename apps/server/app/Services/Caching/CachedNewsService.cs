using app.Abstractions;
using app.Caching;
using domain.Entities;
using Microsoft.Extensions.Options;

namespace app.Services.Caching;

public sealed class CachedNewsService(
    NewsService inner,
    IUserApiCache cache,
    IOptions<UserApiCacheOptions> options) : INewsService
{
    public async Task<IReadOnlyList<News>> GetActiveNewsAsync(
        CancellationToken cancellationToken = default)
    {
        var key = UserApiCacheKeys.NewsActive();
        var cached = await cache.GetAsync<List<News>>(key, cancellationToken);
        if (cached is not null)
            return cached;

        var news = await inner.GetActiveNewsAsync(cancellationToken);
        await cache.SetAsync(
            key,
            news.ToList(),
            TimeSpan.FromMinutes(options.Value.NewsTtlMinutes),
            cancellationToken);
        return news;
    }
}
