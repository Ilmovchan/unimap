using domain.Abstractions;
using domain.Entities;

namespace domain;

public static class LocationPhotoResolver
{
    public static string? MainImageUrl(
        Location location,
        IPictureProvider? pictureProvider = null,
        string? requestBaseUrl = null) =>
        OrderedPhotos(location)
            .Select(p => ResolveUrl(p, pictureProvider, requestBaseUrl))
            .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url));

    public static IReadOnlyList<object> PublicPhotos(
        Location location,
        IPictureProvider pictureProvider,
        string? requestBaseUrl) =>
        OrderedPhotos(location)
            .Select(p => MapPhoto(p, pictureProvider, requestBaseUrl))
            .Where(p => p is not null)
            .Cast<object>()
            .ToList();

    private static IEnumerable<LocationPhoto> OrderedPhotos(Location location) =>
        location.Photos.OrderBy(p => p.CreatedAt);

    private static object? MapPhoto(
        LocationPhoto photo,
        IPictureProvider pictureProvider,
        string? requestBaseUrl)
    {
        var url = ResolveUrl(photo, pictureProvider, requestBaseUrl);
        if (string.IsNullOrWhiteSpace(url))
            return null;

        return new
        {
            photo.Id,
            url,
            altUk = photo.AltUk,
        };
    }

    private static string? ResolveUrl(
        LocationPhoto photo,
        IPictureProvider? pictureProvider,
        string? requestBaseUrl)
    {
        if (pictureProvider is not null)
            return pictureProvider.ResolvePublicUrl(photo, requestBaseUrl);

        var imageUrl = photo.ImageUrl?.Trim();
        return string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl;
    }
}
