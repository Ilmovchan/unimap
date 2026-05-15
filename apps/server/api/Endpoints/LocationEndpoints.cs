using app.Abstractions;

namespace api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/locations");

        group.MapGet("/", GetLocationsAsync);
        group.MapGet("/{id:guid}", GetLocationByIdAsync);
    }

    private static async Task<IResult> GetLocationsAsync(
        ILocationService locationService,
        CancellationToken cancellationToken)
    {
        var locations = await locationService.GetLocationsForMapAsync(cancellationToken);
        return Results.Ok(locations.Select(LocationResponseMaps.LocationForMap));
    }

    private static async Task<IResult> GetLocationByIdAsync(
        Guid id,
        HttpRequest httpRequest,
        ILocationService locationService,
        CancellationToken cancellationToken)
    {
        Guid? highlight = null;
        if (httpRequest.Query.TryGetValue("highlightObjectId", out var highlightRaw)
            && Guid.TryParse(highlightRaw.ToString(), out var highlightId))
        {
            highlight = highlightId;
        }

        var location = await locationService.GetLocationByIdAsync(id, cancellationToken);
        return location is null
            ? Results.NotFound()
            : Results.Ok(LocationResponseMaps.LocationDetail(location, highlight));
    }
}
