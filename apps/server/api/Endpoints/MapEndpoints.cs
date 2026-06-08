using infrastructure.Map;
using Microsoft.AspNetCore.Mvc;

namespace api.Endpoints;

public static class MapEndpoints
{
    public static void MapMapEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/map");

        group.MapGet("/style.json", GetMapStyle);
        group.MapGet("/tiler/{**catchAll}", ProxyMapTiler);
    }

    private static async Task<IResult> GetMapStyle(
        HttpContext context,
        IMapStyleService mapStyleService,
        CancellationToken cancellationToken)
    {
        try
        {
            var json = await mapStyleService.GetStyleJsonAsync(context.Request, cancellationToken);
            context.Response.Headers.CacheControl = "private, max-age=3600";
            return Results.Content(json, "application/json");
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status502BadGateway,
                title: "Failed to load map style");
        }
    }

    private static Task<IResult> ProxyMapTiler(
        HttpContext context,
        [FromRoute] string catchAll,
        MapTilerProxyService proxyService,
        CancellationToken cancellationToken) =>
        proxyService.ForwardAsync(context, catchAll, cancellationToken);
}
