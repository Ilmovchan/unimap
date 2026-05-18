using domain;
using domain.Abstractions;
using domain.Dto;
using domain.Entities;

namespace api;

public static class LocationResponseMaps
{
    public static object LocationMarker(LocationMarkerDto markerDto) =>
        new
        {
            markerDto.Id,
            latitude = markerDto.Latitude,
            longitude = markerDto.Longitude,
            markerKey = LocationTypeMarkerResolver.CanonicalizeMarkerKey(
                markerDto.MarkerKey,
                markerDto.LocationTypeCode),
            type = markerDto.LocationTypeCode,
        };

    private static string ResolveMarkerKey(LocationType lt) =>
        LocationTypeMarkerResolver.Resolve(lt);

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
    public static object LocationForMap(
        Location location,
        IPictureProvider pictureProvider,
        string? requestBaseUrl) =>
        new
        {
            location.Id,
            name = location.Title,
            type = location.LocationType.Code,
            typeName = location.LocationType.TitleUk,
            markerKey = ResolveMarkerKey(location.LocationType),
            latitude = location.Latitude,
            longitude = location.Longitude,
            location.Description,
            imageUrl = LocationPhotoResolver.MainImageUrl(location, pictureProvider, requestBaseUrl),
            location.AddressJson,
            createdAt = location.CreatedAt,
            updatedAt = location.UpdatedAt,
            objects = location.UniversityObjects
                .OrderBy(x => x.Title)
                .Select(UniversityObjectBrief)
                .ToList(),
        };

    /// <summary>Деталі локації та внутрішні об’єкти.</summary>
    public static object LocationDetail(
        Location location,
        IPictureProvider pictureProvider,
        string? requestBaseUrl,
        Guid? highlightedObjectId = null) =>
        new
        {
            location.Id,
            name = location.Title,
            type = location.LocationType.Code,
            typeName = location.LocationType.TitleUk,
            markerKey = ResolveMarkerKey(location.LocationType),
            latitude = location.Latitude,
            longitude = location.Longitude,
            location.Description,
            imageUrl = LocationPhotoResolver.MainImageUrl(location, pictureProvider, requestBaseUrl),
            photos = LocationPhotoResolver.PublicPhotos(location, pictureProvider, requestBaseUrl),
            location.AddressJson,
            createdAt = location.CreatedAt,
            updatedAt = location.UpdatedAt,
            highlightedObjectId,
            objects = location.UniversityObjects
                .OrderBy(x => x.Title)
                .Select(UniversityObjectBrief)
                .ToList(),
        };
}
