using app.Abstractions.Administration;
using app.Models.Admin;
using domain.Abstractions;

namespace api.AdminEndpoints;

public static class LocationAdminEndpoints
{
    public static void MapLocationAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/locations");

        group.MapGet("/", ListAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(
        HttpRequest httpRequest,
        IAdminLocationService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var items = await service.ListAsync(cancellationToken);
        return Results.Ok(
            items.Select(x => AdminEntityResponses.LocationListItem(x, pictureProvider, baseUrl)));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        HttpRequest httpRequest,
        IAdminLocationService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var entity = await service.GetByIdAsync(id, cancellationToken);
        return entity is null
            ? Results.NotFound()
            : Results.Ok(AdminEntityResponses.LocationListItem(entity, pictureProvider, baseUrl));
    }

    private static async Task<IResult> CreateAsync(
        HttpRequest httpRequest,
        LocationWriteDto dto,
        IAdminLocationService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var result = await service.CreateAsync(
            new LocationAdminCreateCommand(
                dto.Id,
                dto.LocationTypeId,
                dto.Title,
                dto.Latitude,
                dto.Longitude,
                dto.Description,
                dto.AddressJson,
                dto.HasShelter,
                dto.Schedule?.Select(x => new LocationScheduleAdminCommand(
                    x.DayOfWeek,
                    x.OpeningAt,
                    x.ClosingAt,
                    x.IsClosed)).ToList()),
            cancellationToken);

        return result.ToHttpResult(location =>
            Results.Created(
                $"/api/admin/locations/{location.Id}",
                AdminEntityResponses.LocationListItem(location, pictureProvider, baseUrl)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        HttpRequest httpRequest,
        LocationWriteDto dto,
        IAdminLocationService service,
        IPictureProvider pictureProvider,
        CancellationToken cancellationToken)
    {
        var baseUrl = RequestBaseUrl.From(httpRequest);
        var result = await service.UpdateAsync(
            id,
            new LocationAdminUpdateCommand(
                dto.LocationTypeId,
                dto.Title,
                dto.Latitude,
                dto.Longitude,
                dto.Description,
                dto.AddressJson,
                dto.HasShelter,
                dto.Schedule?.Select(x => new LocationScheduleAdminCommand(
                    x.DayOfWeek,
                    x.OpeningAt,
                    x.ClosingAt,
                    x.IsClosed)).ToList()),
            cancellationToken);

        return result.ToHttpResult(location =>
            Results.Ok(AdminEntityResponses.LocationListItem(location, pictureProvider, baseUrl)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IAdminLocationService service,
        CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(id, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private sealed record LocationWriteDto(
        Guid? Id,
        Guid LocationTypeId,
        string? Title,
        double? Latitude,
        double? Longitude,
        string? Description,
        string? AddressJson,
        bool HasShelter,
        IReadOnlyList<LocationScheduleWriteDto>? Schedule);

    private sealed record LocationScheduleWriteDto(
        int DayOfWeek,
        TimeOnly? OpeningAt,
        TimeOnly? ClosingAt,
        bool IsClosed);
}
