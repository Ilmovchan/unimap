using infrastructure.Dto;
using infrastructure.GeoService;
using infrastructure.RoutingService;
using Microsoft.AspNetCore.Mvc;

namespace api.Endpoints;

public static class NavigationEndpoints
{
    public static void MapNavigationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/navigation");

        group.MapGet("/route", NavigateRoute);
        group.MapGet("/reverse", GeoReverse);
    }
    
    private static async Task<IResult> NavigateRoute(
        HttpContext context, 
        IRoutingProvider routingProvider,
        [FromQuery] double startLng, double startLat, double endLng, double endLat, string profile = "foot-walking")
    {
        var res = await routingProvider
            .NavigateAsync(startLat, startLng, endLat, endLng, profile);
        
        return Results.Ok(res);
    }

    private static async Task<IResult> GeoReverse(
        HttpContext context,
        IGeoProvider geoProvider,
        [FromQuery] double lng, double lat)
    {
        var res = await geoProvider.GeoReverse(lat, lng);
        
        return Results.Ok(res);
    }

}