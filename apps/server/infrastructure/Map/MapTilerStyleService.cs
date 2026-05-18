using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace infrastructure.Map;

public sealed class MapTilerStyleService(
    IHttpClientFactory httpClientFactory,
    IMemoryCache memoryCache,
    IOptions<MapTilerOptions> options) : IMapStyleService
{
    public async Task<string> GetStyleJsonAsync(
        HttpRequest request,
        CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.ApiKey))
        {
            throw new InvalidOperationException("ExternalApis:MapTiler:ApiKey is not configured.");
        }

        var stylePath = opts.StylePath.Trim().TrimStart('/');
        var cacheKey = MapTilerCacheKeys.ForStyle(stylePath);
        byte[] upstreamBytes;

        if (opts.Cache.Enabled
            && memoryCache.TryGetValue<byte[]>(cacheKey, out var cachedBytes)
            && cachedBytes is not null)
        {
            upstreamBytes = cachedBytes;
        }
        else
        {
            var styleUrl = BuildUpstreamStyleUrl(opts);
            var client = httpClientFactory.CreateClient("MapTiler");
            using var response = await client.GetAsync(styleUrl, cancellationToken);
            var body = await response.Content.ReadAsByteArrayAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorText = Encoding.UTF8.GetString(body);
                throw new HttpRequestException(
                    $"MapTiler style error: {(int)response.StatusCode} {response.ReasonPhrase}. Body: {errorText}");
            }

            upstreamBytes = body;

            if (opts.Cache.Enabled)
            {
                var ttl = TimeSpan.FromMinutes(Math.Max(1, opts.Cache.StyleTtlMinutes));
                memoryCache.Set(
                    cacheKey,
                    upstreamBytes,
                    new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = ttl,
                        Size = Math.Max(1, upstreamBytes.Length),
                    });
            }
        }

        var proxyBase = BuildProxyBase(request);
        var upstreamBase = opts.BaseUrl.TrimEnd('/');
        var text = Encoding.UTF8.GetString(upstreamBytes);
        return RewriteStyleUrls(text, upstreamBase, proxyBase);
    }

    internal static string BuildUpstreamStyleUrl(MapTilerOptions opts)
    {
        var path = opts.StylePath.Trim();
        if (!path.StartsWith('/'))
        {
            path = "/" + path;
        }

        return $"{opts.BaseUrl.TrimEnd('/')}{path}?key={Uri.EscapeDataString(opts.ApiKey)}";
    }

    internal static string BuildProxyBase(HttpRequest request)
    {
        var pathBase = request.PathBase.HasValue
            ? request.PathBase.Value.TrimEnd('/')
            : "";
        return $"{request.Scheme}://{request.Host}{pathBase}/api/map/tiler";
    }

    public static string RewriteStyleUrls(string body, string upstreamBase, string proxyBase)
    {
        if (string.IsNullOrEmpty(body))
        {
            return body;
        }

        return body.Replace(upstreamBase, proxyBase, StringComparison.OrdinalIgnoreCase);
    }
}
