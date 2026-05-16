using domain.Entities;
using Microsoft.EntityFrameworkCore;
using persistence;

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
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var items = await db.News
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.News));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.News.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.News(entity));
    }

    private static async Task<IResult> CreateAsync(
        NewsWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
            return Results.BadRequest(new { error = "title and content are required." });

        var entity = new News
        {
            Id = dto.Id ?? Guid.Empty,
            Title = dto.Title.Trim(),
            Content = dto.Content,
            IsActive = dto.IsActive ?? true,
        };

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        db.News.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/admin/news/{entity.Id}", AdminEntityResponses.News(entity));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        NewsWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.News.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Title))
            entity.Title = dto.Title.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Content))
            entity.Content = dto.Content;
        if (dto.IsActive.HasValue)
            entity.IsActive = dto.IsActive.Value;

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(AdminEntityResponses.News(entity));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.News.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        db.News.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private sealed record NewsWriteDto(
        Guid? Id,
        string? Title,
        string? Content,
        bool? IsActive);
}
