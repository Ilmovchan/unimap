using app.Abstractions;

namespace infrastructure.Caching;

public sealed class NullUserApiCache : IUserApiCache
{
    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) =>
        Task.FromResult<T?>(default);

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? absoluteExpiration = null,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task RemoveByPrefixAsync(string keyPrefix, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
