using System.Text;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace infrastructure.Map;

public sealed class MapTilerProxyService(
    IHttpClientFactory httpClientFactory,
    IMemoryCache memoryCache,
    IOptions<MapTilerOptions> options)
{
    public async Task<IResult> ForwardAsync(
        HttpContext context,
        string catchAll,
        CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.ApiKey))
        {
            return Results.Problem("MapTiler API key is not configured.", statusCode: 503);
        }

        if (string.IsNullOrWhiteSpace(catchAll) || catchAll.Contains("..", StringComparison.Ordinal))
        {
            return Results.BadRequest();
        }

        var upstreamPath = catchAll.TrimStart('/');
        var cacheKey = MapTilerCacheKeys.ForResource(upstreamPath, context.Request.QueryString.Value);

        if (opts.Cache.Enabled
            && memoryCache.TryGetValue<MapTilerCacheEntry>(cacheKey, out var cached)
            && cached is not null)
        {
            return ToResult(cached, context.Request, opts);
        }

        var target = MapTilerProxy.BuildUpstreamUrl(
            opts,
            upstreamPath,
            context.Request.QueryString.Value);
        var client = httpClientFactory.CreateClient("MapTiler");

        using var forwardRequest = new HttpRequestMessage(HttpMethod.Get, target);
        MapTilerProxy.CopyForwardHeaders(context.Request, forwardRequest);

        using var response = await client.SendAsync(
            forwardRequest,
            HttpCompletionOption.ResponseContentRead,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            return Results.Problem(
                detail: errorBody,
                statusCode: (int)response.StatusCode,
                title: "MapTiler proxy error");
        }

        var contentType = response.Content.Headers.ContentType?.ToString()
                          ?? MapTilerProxy.GuessContentType(upstreamPath);
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var requiresRewrite = MapTilerProxy.ShouldRewriteJsonBody(contentType, upstreamPath);
        var ttl = MapTilerCacheTtl.ForPath(upstreamPath, opts.Cache);

        var entry = new MapTilerCacheEntry
        {
            Body = bytes,
            ContentType = contentType,
            RequiresUrlRewrite = requiresRewrite,
            Ttl = ttl,
            ETag = CreateWeakETag(bytes),
        };

        if (opts.Cache.Enabled)
        {
            memoryCache.Set(
                cacheKey,
                entry,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl,
                    Size = Math.Max(1, bytes.Length),
                });
        }

        return ToResult(entry, context.Request, opts);
    }

    private static IResult ToResult(
        MapTilerCacheEntry entry,
        HttpRequest request,
        MapTilerOptions opts)
    {
        ApplyCacheHeaders(request.HttpContext.Response, entry);
        if (IsNotModified(request, entry.ETag))
        {
            return Results.StatusCode(StatusCodes.Status304NotModified);
        }

        if (!entry.RequiresUrlRewrite)
        {
            return Results.Bytes(entry.Body, entry.ContentType);
        }

        var upstreamBase = opts.BaseUrl.TrimEnd('/');
        var proxyBase = MapTilerStyleService.BuildProxyBase(request);
        var body = Encoding.UTF8.GetString(entry.Body);
        var rewritten = MapTilerStyleService.RewriteStyleUrls(body, upstreamBase, proxyBase);
        return Results.Content(rewritten, entry.ContentType);
    }

    private static bool IsNotModified(HttpRequest request, string etag) =>
        request.Headers.IfNoneMatch.Any(value =>
            value?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Any(candidate => candidate.Equals(etag, StringComparison.Ordinal)) == true);

    private static void ApplyCacheHeaders(HttpResponse response, MapTilerCacheEntry entry)
    {
        var maxAge = Math.Max(60, (int)entry.Ttl.TotalSeconds);
        response.Headers.CacheControl = entry.RequiresUrlRewrite
            ? $"private, max-age={maxAge}"
            : $"public, max-age={maxAge}, immutable";
        response.Headers.ETag = entry.ETag;
    }

    private static string CreateWeakETag(byte[] bytes)
    {
        var hash = SHA256.HashData(bytes);
        return $"W/\"{Convert.ToHexString(hash)}\"";
    }
}
