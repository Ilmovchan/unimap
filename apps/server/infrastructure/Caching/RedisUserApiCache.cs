using System.Text.Json;
using System.Text.Json.Serialization;
using app.Abstractions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using UserApiCacheOptions = app.Caching.UserApiCacheOptions;

namespace infrastructure.Caching;

public sealed class RedisUserApiCache : IUserApiCache
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
    };

    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer _multiplexer;
    private readonly UserApiCacheOptions _options;
    private readonly ILogger<RedisUserApiCache> _logger;

    public RedisUserApiCache(
        IDistributedCache cache,
        IConnectionMultiplexer multiplexer,
        IOptions<UserApiCacheOptions> options,
        ILogger<RedisUserApiCache> logger)
    {
        _cache = cache;
        _multiplexer = multiplexer;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var bytes = await _cache.GetAsync(key, cancellationToken);
        if (bytes is null || bytes.Length == 0)
            return default;

        try
        {
            return JsonSerializer.Deserialize<T>(bytes, JsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize cache key {CacheKey}, removing entry", key);
            await _cache.RemoveAsync(key, cancellationToken);
            return default;
        }
    }

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? absoluteExpiration = null,
        CancellationToken cancellationToken = default)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions);
        var entryOptions = new DistributedCacheEntryOptions();
        if (absoluteExpiration.HasValue)
            entryOptions.AbsoluteExpirationRelativeToNow = absoluteExpiration;

        return _cache.SetAsync(key, bytes, entryOptions, cancellationToken);
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) =>
        _cache.RemoveAsync(key, cancellationToken);

    public async Task RemoveByPrefixAsync(string keyPrefix, CancellationToken cancellationToken = default)
    {
        var pattern = _options.InstanceName + keyPrefix + "*";
        var endpoints = _multiplexer.GetEndPoints();
        if (endpoints.Length == 0)
            return;

        var db = _multiplexer.GetDatabase();
        foreach (var endpoint in endpoints)
        {
            var server = _multiplexer.GetServer(endpoint);
            if (!server.IsConnected)
                continue;

            var keys = server.Keys(pattern: pattern).ToArray();
            if (keys.Length == 0)
                continue;

            await db.KeyDeleteAsync(keys);
        }
    }
}
