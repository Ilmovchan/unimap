namespace infrastructure.Map;

internal sealed class MapTilerCacheEntry
{
    public required byte[] Body { get; init; }

    public required string ContentType { get; init; }

    public bool RequiresUrlRewrite { get; init; }

    public required TimeSpan Ttl { get; init; }

    public required string ETag { get; init; }
}

internal static class MapTilerCacheKeys
{
    private const string Prefix = "maptiler:v1";

    public static string ForResource(string upstreamPath, string? queryString)
    {
        var path = upstreamPath.Trim().TrimStart('/');
        var query = MapTilerProxy.NormalizeQueryForCacheKey(queryString);
        return string.IsNullOrEmpty(query)
            ? $"{Prefix}:res:{path}"
            : $"{Prefix}:res:{path}?{query}";
    }

    public static string ForStyle(string stylePath) =>
        $"{Prefix}:style:{stylePath.Trim().TrimStart('/')}";
}

internal static class MapTilerCacheTtl
{
    public static TimeSpan ForPath(string upstreamPath, MapTilerCacheOptions cache)
    {
        if (upstreamPath.Contains("/fonts/", StringComparison.OrdinalIgnoreCase)
            || upstreamPath.StartsWith("fonts/", StringComparison.OrdinalIgnoreCase))
        {
            return TimeSpan.FromHours(Math.Max(1, cache.FontTtlHours));
        }

        if (upstreamPath.Contains("/sprites/", StringComparison.OrdinalIgnoreCase)
            || upstreamPath.StartsWith("sprites/", StringComparison.OrdinalIgnoreCase)
            || upstreamPath.Contains("sprite", StringComparison.OrdinalIgnoreCase))
        {
            return TimeSpan.FromHours(Math.Max(1, cache.SpriteTtlHours));
        }

        if (upstreamPath.EndsWith(".pbf", StringComparison.OrdinalIgnoreCase)
            || upstreamPath.Contains("/tiles/", StringComparison.OrdinalIgnoreCase))
        {
            return TimeSpan.FromHours(Math.Max(1, cache.TileTtlHours));
        }

        return TimeSpan.FromMinutes(Math.Max(1, cache.JsonTtlMinutes));
    }
}
