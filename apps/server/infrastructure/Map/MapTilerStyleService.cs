using System.Text;
using System.Text.Json.Nodes;
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

        if (!Uri.TryCreate(upstreamBase.TrimEnd('/'), UriKind.Absolute, out var upstreamUri)
            || !Uri.TryCreate(proxyBase.TrimEnd('/'), UriKind.Absolute, out var proxyUri))
        {
            return body.Replace(upstreamBase, proxyBase, StringComparison.OrdinalIgnoreCase);
        }

        try
        {
            var node = JsonNode.Parse(body);
            if (node is null)
            {
                return body;
            }

            RewriteJsonNode(node, upstreamUri, proxyUri);
            return node.ToJsonString();
        }
        catch
        {
            return body.Replace(upstreamBase, proxyBase, StringComparison.OrdinalIgnoreCase);
        }
    }

    private static void RewriteJsonNode(JsonNode node, Uri upstreamBase, Uri proxyBase)
    {
        if (node is JsonObject obj)
        {
            foreach (var key in obj.Select(x => x.Key).ToList())
            {
                var child = obj[key];
                if (child is null)
                    continue;

                if (TryRewriteUrlValue(child, upstreamBase, proxyBase, out var rewritten))
                    obj[key] = rewritten;
                else
                    RewriteJsonNode(child, upstreamBase, proxyBase);
            }

            return;
        }

        if (node is JsonArray arr)
        {
            for (var i = 0; i < arr.Count; i++)
            {
                var child = arr[i];
                if (child is null)
                    continue;

                if (TryRewriteUrlValue(child, upstreamBase, proxyBase, out var rewritten))
                    arr[i] = rewritten;
                else
                    RewriteJsonNode(child, upstreamBase, proxyBase);
            }
        }
    }

    private static bool TryRewriteUrlValue(
        JsonNode node,
        Uri upstreamBase,
        Uri proxyBase,
        out string rewritten)
    {
        rewritten = string.Empty;

        if (node is not JsonValue value
            || !value.TryGetValue<string>(out var text)
            || string.IsNullOrWhiteSpace(text)
            || !Uri.TryCreate(text, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!uri.Scheme.Equals(upstreamBase.Scheme, StringComparison.OrdinalIgnoreCase)
            || !uri.Host.Equals(upstreamBase.Host, StringComparison.OrdinalIgnoreCase)
            || uri.Port != upstreamBase.Port)
        {
            return false;
        }

        var upstreamText = upstreamBase.ToString().TrimEnd('/');
        if (!text.StartsWith(upstreamText, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var suffix = text[upstreamText.Length..];
        var queryStart = suffix.IndexOf('?');
        var path = queryStart < 0 ? suffix : suffix[..queryStart];
        var query = queryStart < 0 ? string.Empty : StripSecretQueryParams(suffix[queryStart..]);
        rewritten = $"{proxyBase}{path}{query}";
        return true;
    }

    private static string StripSecretQueryParams(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return string.Empty;

        var raw = query.StartsWith('?') ? query[1..] : query;
        var parts = raw
            .Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(part =>
            {
                var eq = part.IndexOf('=');
                var key = eq < 0 ? part : part[..eq];
                key = Uri.UnescapeDataString(key);
                return !key.Equals("key", StringComparison.OrdinalIgnoreCase)
                       && !key.Equals("api_key", StringComparison.OrdinalIgnoreCase);
            })
            .ToArray();

        return parts.Length == 0 ? string.Empty : $"?{string.Join('&', parts)}";
    }
}
