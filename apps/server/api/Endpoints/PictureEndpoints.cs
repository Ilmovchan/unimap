using domain.Abstractions;

namespace api.Endpoints;

public static class PictureEndpoints
{
    public static void MapPictureEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/pictures/{*storageKey}", GetPictureAsync);
    }

    private static async Task<IResult> GetPictureAsync(
        string storageKey,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
            return Results.BadRequest();

        var content = await pictureProvider.OpenReadAsync(storageKey, cancellationToken);
        if (content is null)
            return Results.NotFound();

        return Results.Stream(
            content.Stream,
            content.ContentType,
            enableRangeProcessing: true);
    }
}
