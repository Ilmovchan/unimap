using domain.Entities;
using Microsoft.EntityFrameworkCore;
using persistence;

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
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var items = await db.UniversityObjectTypes
            .AsNoTracking()
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.UniversityObjectType));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjectTypes.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.UniversityObjectType(entity));
    }

    private static async Task<IResult> CreateAsync(
        UniversityObjectTypeWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.TitleUk))
            return Results.BadRequest(new { error = "code and titleUk are required." });

        var entity = new UniversityObjectType
        {
            Id = dto.Id ?? Guid.Empty,
            Code = dto.Code.Trim(),
            TitleUk = dto.TitleUk.Trim(),
        };

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        db.UniversityObjectTypes.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created(
            $"/api/admin/university-object-types/{entity.Id}",
            AdminEntityResponses.UniversityObjectType(entity));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UniversityObjectTypeWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjectTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Code))
            entity.Code = dto.Code.Trim();
        if (!string.IsNullOrWhiteSpace(dto.TitleUk))
            entity.TitleUk = dto.TitleUk.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(AdminEntityResponses.UniversityObjectType(entity));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjectTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        db.UniversityObjectTypes.Remove(entity);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Results.Conflict(new { error = "Cannot delete: university objects reference this type." });
        }

        return Results.NoContent();
    }

    private sealed record UniversityObjectTypeWriteDto(Guid? Id, string? Code, string? TitleUk);
}
