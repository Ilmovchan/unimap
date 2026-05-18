using domain;
using domain.Abstractions;
using domain.Entities;

namespace api.AdminEndpoints;

internal static class AdminEntityResponses
{
    internal static object LocationType(LocationType entity) =>
        new
        {
            entity.Id,
            entity.Code,
            titleUk = entity.TitleUk,
            markerKey = entity.MarkerKey,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object Location(Location entity) =>
        new
        {
            entity.Id,
            locationTypeId = entity.LocationTypeId,
            entity.Title,
            entity.Latitude,
            entity.Longitude,
            entity.Description,
            imageUrl = LocationPhotoResolver.MainImageUrl(entity),
            addressJson = entity.AddressJson,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object LocationListItem(
        Location entity,
        IPictureProvider? pictureProvider = null,
        string? requestBaseUrl = null) =>
        new
        {
            entity.Id,
            locationTypeId = entity.LocationTypeId,
            locationTypeTitle = entity.LocationType?.TitleUk ?? string.Empty,
            entity.Title,
            latitude = entity.Latitude,
            longitude = entity.Longitude,
            entity.Description,
            imageUrl = LocationPhotoResolver.MainImageUrl(entity, pictureProvider, requestBaseUrl),
            addressJson = entity.AddressJson,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object LocationPhoto(
        LocationPhoto photo,
        IPictureProvider pictureProvider,
        string? requestBaseUrl) =>
        new
        {
            photo.Id,
            locationId = photo.LocationId,
            url = pictureProvider.ResolvePublicUrl(photo, requestBaseUrl),
            storageKey = photo.StorageKey,
            altUk = photo.AltUk,
            createdAt = photo.CreatedAt,
            updatedAt = photo.UpdatedAt,
        };

    internal static object UniversityObjectType(UniversityObjectType entity) =>
        new
        {
            entity.Id,
            entity.Code,
            titleUk = entity.TitleUk,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object UniversityObject(UniversityObject entity) =>
        new
        {
            entity.Id,
            locationId = entity.LocationId,
            objectTypeId = entity.ObjectTypeId,
            entity.Title,
            entity.Description,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object UniversityObjectListItem(UniversityObject entity) =>
        new
        {
            entity.Id,
            locationId = entity.LocationId,
            locationTitle = entity.Location?.Title ?? string.Empty,
            objectTypeId = entity.ObjectTypeId,
            objectTypeTitleUk = entity.ObjectType?.TitleUk ?? string.Empty,
            entity.Title,
            entity.Description,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object News(News entity) =>
        new
        {
            entity.Id,
            entity.Title,
            content = entity.Content,
            entity.IsActive,
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
        };

    internal static object Admin(Admin entity) =>
        new
        {
            entity.Id,
            entity.Username,
            entity.Email,
            passwordHash = entity.PasswordHash,
            role = entity.Role.ToStorage(),
            createdAt = entity.CreatedAt,
            updatedAt = entity.UpdatedAt,
            lastLoginAt = entity.LastLoginAt,
        };

    internal static object AdminPublic(Admin entity) =>
        new
        {
            entity.Id,
            entity.Username,
            entity.Email,
            role = entity.Role.ToStorage(),
            lastLoginAt = entity.LastLoginAt,
        };
}
