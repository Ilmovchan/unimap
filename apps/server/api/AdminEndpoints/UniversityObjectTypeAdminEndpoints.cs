using app.Abstractions.Administration;
using app.Models.Admin;

namespace api.AdminEndpoints;

public static class UniversityObjectTypeAdminEndpoints
{
    public static void MapUniversityObjectTypeAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/university-object-types");

        group.MapGet("/", ListAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(
        IAdminUniversityObjectTypeService service,
        CancellationToken cancellationToken)
    {
        var items = await service.ListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.UniversityObjectType));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IAdminUniversityObjectTypeService service,
        CancellationToken cancellationToken)
    {
        var entity = await service.GetByIdAsync(id, cancellationToken);
        return entity is null
            ? Results.NotFound()
            : Results.Ok(AdminEntityResponses.UniversityObjectType(entity));
    }

    private static async Task<IResult> CreateAsync(
        UniversityObjectTypeWriteDto dto,
        IAdminUniversityObjectTypeService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(
            new UniversityObjectTypeAdminCreateCommand(dto.Id, dto.Code, dto.TitleUk),
            cancellationToken);

        return result.ToHttpResult(entity =>
            Results.Created(
                $"/api/admin/university-object-types/{entity.Id}",
                AdminEntityResponses.UniversityObjectType(entity)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UniversityObjectTypeWriteDto dto,
        IAdminUniversityObjectTypeService service,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(
            id,
            new UniversityObjectTypeAdminUpdateCommand(dto.Code, dto.TitleUk),
            cancellationToken);

        return result.ToHttpResult(entity => Results.Ok(AdminEntityResponses.UniversityObjectType(entity)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IAdminUniversityObjectTypeService service,
        CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(id, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private sealed record UniversityObjectTypeWriteDto(Guid? Id, string? Code, string? TitleUk);
}
