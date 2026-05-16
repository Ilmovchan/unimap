using domain.Entities;
using Microsoft.EntityFrameworkCore;
using persistence;

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
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var items = await db.LocationTypes
            .AsNoTracking()
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.LocationType));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.LocationTypes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.LocationType(entity));
    }

    private static async Task<IResult> CreateAsync(
        LocationTypeWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.TitleUk))
            return Results.BadRequest(new { error = "code and titleUk are required." });

        var entity = new LocationType
        {
            Id = dto.Id ?? Guid.Empty,
            Code = dto.Code.Trim(),
            TitleUk = dto.TitleUk.Trim(),
            MarkerKey = (dto.MarkerKey ?? string.Empty).Trim(),
        };

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        db.LocationTypes.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/admin/location-types/{entity.Id}", AdminEntityResponses.LocationType(entity));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        LocationTypeWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.LocationTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Code))
            entity.Code = dto.Code.Trim();
        if (!string.IsNullOrWhiteSpace(dto.TitleUk))
            entity.TitleUk = dto.TitleUk.Trim();
        if (dto.MarkerKey is not null)
            entity.MarkerKey = dto.MarkerKey.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(AdminEntityResponses.LocationType(entity));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.LocationTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        db.LocationTypes.Remove(entity);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Results.Conflict(new { error = "Cannot delete: locations reference this type." });
        }

        return Results.NoContent();
    }

    private sealed record LocationTypeWriteDto(
        Guid? Id,
        string? Code,
        string? TitleUk,
        string? MarkerKey);
}
