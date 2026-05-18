using app.Abstractions.Administration;
using app.Models.Admin;

namespace api.AdminEndpoints;

public static class LocationTypeAdminEndpoints
{
    public static void MapLocationTypeAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/location-types");

        group.MapGet("/", ListAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(
        IAdminLocationTypeService service,
        CancellationToken cancellationToken)
    {
        var items = await service.ListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.LocationType));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IAdminLocationTypeService service,
        CancellationToken cancellationToken)
    {
        var entity = await service.GetByIdAsync(id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.LocationType(entity));
    }

    private static async Task<IResult> CreateAsync(
        LocationTypeWriteDto dto,
        IAdminLocationTypeService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(
            new LocationTypeAdminCreateCommand(dto.Id, dto.Code, dto.TitleUk, dto.MarkerKey),
            cancellationToken);

        return result.ToHttpResult(entity =>
            Results.Created($"/api/admin/location-types/{entity.Id}", AdminEntityResponses.LocationType(entity)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        LocationTypeWriteDto dto,
        IAdminLocationTypeService service,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(
            id,
            new LocationTypeAdminUpdateCommand(dto.Code, dto.TitleUk, dto.MarkerKey),
            cancellationToken);

        return result.ToHttpResult(entity => Results.Ok(AdminEntityResponses.LocationType(entity)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IAdminLocationTypeService service,
        CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(id, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private sealed record LocationTypeWriteDto(
        Guid? Id,
        string? Code,
        string? TitleUk,
        string? MarkerKey);
}
