using app.Abstractions.Administration;
using app.Models.Admin;

namespace api.AdminEndpoints;

public static class UniversityObjectAdminEndpoints
{
    public static void MapUniversityObjectAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/university-objects");

        group.MapGet("/", ListAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(
        IAdminUniversityObjectService service,
        CancellationToken cancellationToken)
    {
        var items = await service.ListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.UniversityObjectListItem));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IAdminUniversityObjectService service,
        CancellationToken cancellationToken)
    {
        var entity = await service.GetByIdAsync(id, cancellationToken);
        return entity is null
            ? Results.NotFound()
            : Results.Ok(AdminEntityResponses.UniversityObjectListItem(entity));
    }

    private static async Task<IResult> CreateAsync(
        UniversityObjectWriteDto dto,
        IAdminUniversityObjectService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(
            new UniversityObjectAdminCreateCommand(
                dto.Id,
                dto.LocationId,
                dto.ObjectTypeId,
                dto.Title,
                dto.Description,
                dto.Manager,
                dto.PhoneNumber,
                dto.WebUrl),
            cancellationToken);

        return result.ToHttpResult(entity =>
            Results.Created(
                $"/api/admin/university-objects/{entity.Id}",
                AdminEntityResponses.UniversityObject(entity)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UniversityObjectWriteDto dto,
        IAdminUniversityObjectService service,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(
            id,
            new UniversityObjectAdminUpdateCommand(
                dto.LocationId,
                dto.ObjectTypeId,
                dto.Title,
                dto.Description,
                dto.Manager,
                dto.PhoneNumber,
                dto.WebUrl),
            cancellationToken);

        return result.ToHttpResult(entity => Results.Ok(AdminEntityResponses.UniversityObject(entity)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IAdminUniversityObjectService service,
        CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(id, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private sealed record UniversityObjectWriteDto(
        Guid? Id,
        Guid LocationId,
        Guid ObjectTypeId,
        string? Title,
        string? Description,
        string? Manager,
        string? PhoneNumber,
        string? WebUrl);
}
