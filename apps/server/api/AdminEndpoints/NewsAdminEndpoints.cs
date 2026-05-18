using app.Abstractions.Administration;
using app.Models.Admin;

namespace api.AdminEndpoints;

public static class NewsAdminEndpoints
{
    public static void MapNewsAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/news");

        group.MapGet("/", ListAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);
    }

    private static async Task<IResult> ListAsync(
        IAdminNewsService service,
        CancellationToken cancellationToken)
    {
        var items = await service.ListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.News));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IAdminNewsService service,
        CancellationToken cancellationToken)
    {
        var entity = await service.GetByIdAsync(id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.News(entity));
    }

    private static async Task<IResult> CreateAsync(
        NewsWriteDto dto,
        IAdminNewsService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(
            new NewsAdminCreateCommand(dto.Id, dto.Title, dto.Content, dto.IsActive),
            cancellationToken);

        return result.ToHttpResult(entity =>
            Results.Created($"/api/admin/news/{entity.Id}", AdminEntityResponses.News(entity)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        NewsWriteDto dto,
        IAdminNewsService service,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(
            id,
            new NewsAdminUpdateCommand(dto.Title, dto.Content, dto.IsActive),
            cancellationToken);

        return result.ToHttpResult(entity => Results.Ok(AdminEntityResponses.News(entity)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IAdminNewsService service,
        CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(id, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private sealed record NewsWriteDto(
        Guid? Id,
        string? Title,
        string? Content,
        bool? IsActive);
}
