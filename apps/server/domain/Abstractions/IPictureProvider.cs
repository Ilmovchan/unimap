using domain.Entities;

namespace domain.Abstractions;

public interface IPictureProvider
{
    string? ResolvePublicUrl(LocationPhoto photo, string? requestBaseUrl);

    string? ResolvePublicUrlForStorageKey(string storageKey, string? requestBaseUrl);

    Task<PictureContent?> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default);

    Task SaveAsync(
        string storageKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}

public sealed class PictureContent : IAsyncDisposable
{
    public required Stream Stream { get; init; }

    public required string ContentType { get; init; }

    public async ValueTask DisposeAsync()
    {
        await Stream.DisposeAsync();
    }
}
