using domain.Entities;
using Microsoft.EntityFrameworkCore;
using persistence;

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
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var items = await db.Locations
            .AsNoTracking()
            .Include(x => x.LocationType)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.LocationListItem));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Locations
            .AsNoTracking()
            .Include(x => x.LocationType)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.LocationListItem(entity));
    }

    private static async Task<IResult> CreateAsync(
        LocationWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (dto.LocationTypeId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Title))
            return Results.BadRequest(new { error = "locationTypeId and title are required." });

        var entity = new Location
        {
            Id = dto.Id ?? Guid.Empty,
            LocationTypeId = dto.LocationTypeId,
            Title = dto.Title.Trim(),
            Latitude = dto.Latitude ?? 0,
            Longitude = dto.Longitude ?? 0,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            AddressJson = dto.AddressJson,
        };

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        if (!await db.LocationTypes.AnyAsync(x => x.Id == entity.LocationTypeId, cancellationToken))
            return Results.BadRequest(new { error = "locationTypeId does not exist." });

        db.Locations.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        var created = await LoadLocationListItemAsync(db, entity.Id, cancellationToken);
        return Results.Created($"/api/admin/locations/{entity.Id}", created);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        LocationWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Locations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        if (dto.LocationTypeId != Guid.Empty)
        {
            if (!await db.LocationTypes.AnyAsync(x => x.Id == dto.LocationTypeId, cancellationToken))
                return Results.BadRequest(new { error = "locationTypeId does not exist." });
            entity.LocationTypeId = dto.LocationTypeId;
        }

        if (!string.IsNullOrWhiteSpace(dto.Title))
            entity.Title = dto.Title.Trim();
        if (dto.Latitude.HasValue)
            entity.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue)
            entity.Longitude = dto.Longitude.Value;
        if (dto.Description is not null)
            entity.Description = dto.Description;
        if (dto.ImageUrl is not null)
            entity.ImageUrl = dto.ImageUrl;
        if (dto.AddressJson is not null)
            entity.AddressJson = dto.AddressJson;

        await db.SaveChangesAsync(cancellationToken);
        var updated = await LoadLocationListItemAsync(db, entity.Id, cancellationToken);
        return Results.Ok(updated);
    }

    private static async Task<object> LoadLocationListItemAsync(
        UniMapDbContext db,
        Guid id,
        CancellationToken cancellationToken)
    {
        var entity = await db.Locations
            .AsNoTracking()
            .Include(x => x.LocationType)
            .FirstAsync(x => x.Id == id, cancellationToken);
        return AdminEntityResponses.LocationListItem(entity);
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Locations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        db.Locations.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private sealed record LocationWriteDto(
        Guid? Id,
        Guid LocationTypeId,
        string? Title,
        double? Latitude,
        double? Longitude,
        string? Description,
        string? ImageUrl,
        string? AddressJson);
}
