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
        IAdminLocationPhotoService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        if (!httpRequest.HasFormContentType)
            return Results.BadRequest(new { error = "multipart form data is required." });

        var form = await httpRequest.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
        if (file is null || file.Length == 0)
            return Results.BadRequest(new { error = "file is required." });

        var altUk = form["altUk"].ToString();

        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;

        var command = new LocationPhotoAdminUploadCommand(
            stream,
            file.FileName,
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            file.Length,
            string.IsNullOrWhiteSpace(altUk) ? null : altUk);

        var baseUrl = RequestBaseUrl.From(httpRequest);
        var result = await service.UploadAsync(locationId, command, baseUrl, cancellationToken);
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
            new LocationPhotoAdminUpdateCommand(dto.AltUk),
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

    private sealed record LocationPhotoUpdateDto(string? AltUk);
}
