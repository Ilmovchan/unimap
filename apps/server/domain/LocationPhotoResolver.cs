using domain.Entities;

namespace domain;

public static class LocationPhotoResolver
{
    public static string? MainImageUrl(Location location) =>
        location.Photos
            .OrderByDescending(p => p.IsMain)
            .ThenBy(p => p.CreatedAt)
            .Select(p => p.ImageUrl)
            .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url));
}
