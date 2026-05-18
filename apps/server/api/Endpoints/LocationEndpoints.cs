using app.Abstractions;
using domain.Abstractions;

namespace api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/locations");

        group.MapGet("/markers", GetLocationMarkersAsync);
        group.MapGet("/", GetLocationsListAsync);
        group.MapGet("/{id:guid}", GetLocationByIdAsync);
    }

    private static async Task<IResult> GetLocationMarkersAsync(
        ILocationService locationService,
        CancellationToken cancellationToken)
    {
        var markers = await locationService.GetLocationMarkersAsync(cancellationToken);
        return Results.Ok(markers.Select(LocationResponseMaps.LocationMarker));
    }

    private static async Task<IResult> GetLocationsListAsync(
        HttpRequest httpRequest,
        ILocationService locationService,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var locations = await locationService.GetLocationsListAsync(cancellationToken);
        return Results.Ok(
            locations.Select(l => LocationResponseMaps.LocationForMap(l, pictureProvider, baseUrl)));
    }

    private static async Task<IResult> GetLocationByIdAsync(
        Guid id,
        HttpRequest httpRequest,
        ILocationService locationService,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        Guid? highlight = null;
        if (httpRequest.Query.TryGetValue("highlightObjectId", out var highlightRaw)
            && Guid.TryParse(highlightRaw.ToString(), out var highlightId))
        {
            highlight = highlightId;
        }

        var baseUrl = RequestBaseUrl.From(httpRequest);
        var location = await locationService.GetLocationByIdAsync(id, cancellationToken);
        return location is null
            ? Results.NotFound()
            : Results.Ok(
                LocationResponseMaps.LocationDetail(
                    location,
                    pictureProvider,
                    baseUrl,
                    highlight));
    }
}
