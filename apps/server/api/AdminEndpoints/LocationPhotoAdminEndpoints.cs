using app.Abstractions.Administration;
using app.Models.Admin;
using domain.Abstractions;

namespace api.AdminEndpoints;

public static class LocationPhotoAdminEndpoints
{
    public static void MapLocationPhotoAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/locations/{locationId:guid}/photos");

        group.MapGet("/", ListAsync);
        group.MapPost("/", UploadAsync);
        group.MapPut("/{photoId:guid}", UpdateAsync);
        group.MapDelete("/{photoId:guid}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(
        Guid locationId,
        HttpRequest httpRequest,
        IAdminLocationPhotoService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var result = await service.ListAsync(locationId, cancellationToken);
        return result.ToHttpResult(photos =>
            Results.Ok(photos.Select(p => AdminEntityResponses.LocationPhoto(p, pictureProvider, baseUrl))));
    }

    private static async Task<IResult> UploadAsync(
        Guid locationId,
        HttpRequest httpRequest,
        IFormFile? file,
        string? altUk,
        bool? isMain,
        IAdminLocationPhotoService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        if (file is null)
            return Results.BadRequest(new { error = "file is required." });

        await using var stream = file.OpenReadStream();
        var command = new LocationPhotoAdminUploadCommand(
            stream,
            file.FileName,
            file.ContentType ?? "application/octet-stream",
            file.Length,
            altUk,
            isMain);

        var result = await service.UploadAsync(locationId, command, cancellationToken);
        var baseUrl = RequestBaseUrl.From(httpRequest);
        return result.ToHttpResult(photo =>
            Results.Created(
                $"/api/admin/locations/{locationId}/photos/{photo.Id}",
                AdminEntityResponses.LocationPhoto(photo, pictureProvider, baseUrl)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid locationId,
        Guid photoId,
        HttpRequest httpRequest,
        LocationPhotoUpdateDto dto,
        IAdminLocationPhotoService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var result = await service.UpdateAsync(
            locationId,
            photoId,
            new LocationPhotoAdminUpdateCommand(dto.AltUk, dto.IsMain),
            cancellationToken);

        return result.ToHttpResult(photo =>
            Results.Ok(AdminEntityResponses.LocationPhoto(photo, pictureProvider, baseUrl)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid locationId,
        Guid photoId,
        IAdminLocationPhotoService service,
        CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(locationId, photoId, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private sealed record LocationPhotoUpdateDto(string? AltUk, bool? IsMain);
}
