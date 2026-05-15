using domain.Entities;

namespace api;

public static class LocationResponseMaps
{
    private static string ResolveMarkerKey(LocationType lt)
    {
        if (!string.IsNullOrWhiteSpace(lt.MarkerKey))
            return lt.MarkerKey.Trim().ToLowerInvariant();

        return LocationTypeMarkerResolver.ResolveFromNameUk(lt.TitleUk);
    }

    private static object UniversityObjectBrief(UniversityObject o) =>
        new
        {
            o.Id,
            name = o.Title,
            type = o.ObjectType.Code,
            typeName = o.ObjectType.TitleUk,
            o.Description,
        };

    /// <summary>Список локацій для карти (координати лише як latitude/longitude, об’єкти включно).</summary>
    public static object LocationForMap(Location location) =>
        new
        {
            location.Id,
            name = location.Title,
            type = location.LocationType.Code,
            markerKey = ResolveMarkerKey(location.LocationType),
            latitude = location.Latitude,
            longitude = location.Longitude,
            location.Description,
            location.ImageUrl,
            location.AddressJson,
            objects = location.UniversityObjects
                .OrderBy(x => x.Title)
                .Select(UniversityObjectBrief)
                .ToList(),
        };

    /// <summary>Деталі локації та внутрішні об’єкти.</summary>
    public static object LocationDetail(Location location, Guid? highlightedObjectId = null) =>
        new
        {
            location.Id,
            name = location.Title,
            type = location.LocationType.Code,
            markerKey = ResolveMarkerKey(location.LocationType),
            latitude = location.Latitude,
            longitude = location.Longitude,
            location.Description,
            location.ImageUrl,
            location.AddressJson,
            highlightedObjectId,
            objects = location.UniversityObjects
                .OrderBy(x => x.Title)
                .Select(UniversityObjectBrief)
                .ToList(),
        };
}
