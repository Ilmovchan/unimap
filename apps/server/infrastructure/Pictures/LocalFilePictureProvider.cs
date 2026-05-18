using domain.Abstractions;
using domain.Entities;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace infrastructure.Pictures;

public sealed class LocalFilePictureProvider : IPictureProvider
{
    private readonly string _rootPath;
    private readonly string? _configuredPublicBaseUrl;

    public LocalFilePictureProvider(
        IHostEnvironment environment,
        IOptions<PicturesOptions> options)
    {
        var opts = options.Value;
        _rootPath = Path.GetFullPath(
            Path.Combine(environment.ContentRootPath, opts.LocalRootPath));
        _configuredPublicBaseUrl = string.IsNullOrWhiteSpace(opts.PublicBaseUrl)
            ? null
            : opts.PublicBaseUrl.TrimEnd('/');
    }

    public string? ResolvePublicUrl(LocationPhoto photo, string? requestBaseUrl)
    {
        if (IsAbsoluteHttpUrl(photo.ImageUrl))
            return photo.ImageUrl.Trim();

        if (!string.IsNullOrWhiteSpace(photo.StorageKey))
            return ResolvePublicUrlForStorageKey(photo.StorageKey, requestBaseUrl);

        var imageUrl = photo.ImageUrl?.Trim();
        return string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl;
    }

    public string? ResolvePublicUrlForStorageKey(string storageKey, string? requestBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
            return null;

        return BuildApiUrl(storageKey.Trim(), requestBaseUrl);
    }

    public Task<PictureContent?> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryResolveSafeFilePath(storageKey, out var fullPath))
            return Task.FromResult<PictureContent?>(null);

        if (!File.Exists(fullPath))
            return Task.FromResult<PictureContent?>(null);

        Stream stream = File.OpenRead(fullPath);
        var contentType = GuessContentType(fullPath);
        return Task.FromResult<PictureContent?>(new PictureContent
        {
            Stream = stream,
            ContentType = contentType,
        });
    }

    public async Task SaveAsync(
        string storageKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        _ = contentType;
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryResolveSafeFilePath(storageKey, out var fullPath))
            throw new InvalidOperationException("Invalid storage key.");

        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        await using var file = File.Create(fullPath);
        await content.CopyToAsync(file, cancellationToken);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryResolveSafeFilePath(storageKey, out var fullPath))
            return Task.CompletedTask;

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    private string BuildApiUrl(string storageKey, string? requestBaseUrl)
    {
        var baseUrl = ResolvePublicBaseUrl(requestBaseUrl);
        var encodedKey = EncodeStorageKeyForUrl(storageKey);
        return $"{baseUrl}/api/pictures/{encodedKey}";
    }

    private string ResolvePublicBaseUrl(string? requestBaseUrl)
    {
        if (!string.IsNullOrWhiteSpace(requestBaseUrl))
            return requestBaseUrl.TrimEnd('/');

        if (!string.IsNullOrWhiteSpace(_configuredPublicBaseUrl))
            return _configuredPublicBaseUrl;

        return "http://localhost:5286";
    }

    private static string EncodeStorageKeyForUrl(string storageKey) =>
        string.Join(
            '/',
            storageKey
                .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(Uri.EscapeDataString));

    private bool TryResolveSafeFilePath(string storageKey, out string fullPath)
    {
        fullPath = string.Empty;
        if (string.IsNullOrWhiteSpace(storageKey))
            return false;

        var normalized = storageKey.Replace('\\', '/').Trim('/');
        if (normalized.Contains("..", StringComparison.Ordinal))
            return false;

        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0)
            return false;

        foreach (var segment in segments)
        {
            if (segment is "." or "..")
                return false;
        }

        fullPath = Path.GetFullPath(Path.Combine([_rootPath, .. segments]));
        if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private static bool IsAbsoluteHttpUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static string GuessContentType(string path) =>
        Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".avif" => "image/avif",
            _ => "application/octet-stream",
        };
}
