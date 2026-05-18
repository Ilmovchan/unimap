using Microsoft.AspNetCore.Http;

namespace infrastructure.Map;

public static class MapTilerProxy
{
    internal static bool ShouldRewriteJsonBody(string contentType, string upstreamPath)
    {
        if (IsBinaryPath(upstreamPath))
        {
            return false;
        }

        if (upstreamPath.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase)
               && !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsBinaryPath(string path) =>
        path.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
        || path.EndsWith(".pbf", StringComparison.OrdinalIgnoreCase)
        || path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase)
        || path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase)
        || path.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase);

    internal static string BuildUpstreamUrl(
        MapTilerOptions opts,
        string upstreamPath,
        string? queryString)
    {
        var baseUrl = $"{opts.BaseUrl.TrimEnd('/')}/{upstreamPath}";
        var query = ParseQuery(queryString);
        query["key"] = opts.ApiKey;
        var qs = string.Join(
            "&",
            query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));
        return $"{baseUrl}?{qs}";
    }

    internal static string NormalizeQueryForCacheKey(string? queryString)
    {
        var query = ParseQuery(queryString);
        if (query.Count == 0)
        {
            return "";
        }

        return string.Join(
            "&",
            query
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"{kv.Key}={kv.Value}"));
    }

    private static Dictionary<string, string> ParseQuery(string? queryString)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrEmpty(queryString))
        {
            return result;
        }

        var raw = queryString.StartsWith('?') ? queryString[1..] : queryString;
        foreach (var part in raw.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var eq = part.IndexOf('=');
            if (eq < 0)
            {
                result[Uri.UnescapeDataString(part)] = "";
                continue;
            }

            var key = Uri.UnescapeDataString(part[..eq]);
            var value = Uri.UnescapeDataString(part[(eq + 1)..]);
            if (!key.Equals("key", StringComparison.OrdinalIgnoreCase)
                && !key.Equals("api_key", StringComparison.OrdinalIgnoreCase))
            {
                result[key] = value;
            }
        }

        return result;
    }

    internal static void CopyForwardHeaders(HttpRequest incoming, HttpRequestMessage outgoing)
    {
        if (incoming.Headers.TryGetValue("Accept", out var accept))
        {
            outgoing.Headers.TryAddWithoutValidation("Accept", accept.ToString());
        }

        if (incoming.Headers.TryGetValue("If-None-Match", out var etag))
        {
            outgoing.Headers.TryAddWithoutValidation("If-None-Match", etag.ToString());
        }
    }

    internal static string GuessContentType(string path)
    {
        if (path.EndsWith(".pbf", StringComparison.OrdinalIgnoreCase))
        {
            return "application/x-protobuf";
        }

        if (path.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return "application/json";
        }

        if (path.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
        {
            return "image/png";
        }

        if (path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase))
        {
            return "image/webp";
        }

        return "application/octet-stream";
    }
}
