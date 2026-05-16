using domain.Entities;
using Microsoft.EntityFrameworkCore;
using persistence;

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
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var items = await db.UniversityObjects
            .AsNoTracking()
            .Include(x => x.Location)
            .Include(x => x.ObjectType)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.UniversityObjectListItem));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjects
            .AsNoTracking()
            .Include(x => x.Location)
            .Include(x => x.ObjectType)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null
            ? Results.NotFound()
            : Results.Ok(AdminEntityResponses.UniversityObjectListItem(entity));
    }

    private static async Task<IResult> CreateAsync(
        UniversityObjectWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (dto.LocationId == Guid.Empty || dto.ObjectTypeId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Title))
            return Results.BadRequest(new { error = "locationId, objectTypeId and title are required." });

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        if (!await db.Locations.AnyAsync(x => x.Id == dto.LocationId, cancellationToken))
            return Results.BadRequest(new { error = "locationId does not exist." });
        if (!await db.UniversityObjectTypes.AnyAsync(x => x.Id == dto.ObjectTypeId, cancellationToken))
            return Results.BadRequest(new { error = "objectTypeId does not exist." });

        var entity = new UniversityObject
        {
            Id = dto.Id ?? Guid.Empty,
            LocationId = dto.LocationId,
            ObjectTypeId = dto.ObjectTypeId,
            Title = dto.Title.Trim(),
            Description = dto.Description,
        };

        db.UniversityObjects.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created(
            $"/api/admin/university-objects/{entity.Id}",
            AdminEntityResponses.UniversityObject(entity));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UniversityObjectWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjects.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        if (dto.LocationId != Guid.Empty)
        {
            if (!await db.Locations.AnyAsync(x => x.Id == dto.LocationId, cancellationToken))
                return Results.BadRequest(new { error = "locationId does not exist." });
            entity.LocationId = dto.LocationId;
        }

        if (dto.ObjectTypeId != Guid.Empty)
        {
            if (!await db.UniversityObjectTypes.AnyAsync(x => x.Id == dto.ObjectTypeId, cancellationToken))
                return Results.BadRequest(new { error = "objectTypeId does not exist." });
            entity.ObjectTypeId = dto.ObjectTypeId;
        }

        if (!string.IsNullOrWhiteSpace(dto.Title))
            entity.Title = dto.Title.Trim();
        if (dto.Description is not null)
            entity.Description = dto.Description;

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(AdminEntityResponses.UniversityObject(entity));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.UniversityObjects.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        db.UniversityObjects.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private sealed record UniversityObjectWriteDto(
        Guid? Id,
        Guid LocationId,
        Guid ObjectTypeId,
        string? Title,
        string? Description);
}
