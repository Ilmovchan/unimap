using domain.Entities;
using Microsoft.EntityFrameworkCore;
using persistence;

namespace api.AdminEndpoints;

public static class AdminAdminEndpoints
{
    public static void MapAdminAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admins");

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
        var items = await db.Admins
            .AsNoTracking()
            .OrderBy(x => x.Email)
            .ToListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.Admin));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Admins.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.Admin(entity));
    }

    private static async Task<IResult> CreateAsync(
        AdminWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.PasswordHash) ||
            string.IsNullOrWhiteSpace(dto.Role))
            return Results.BadRequest(new { error = "username, email, password_hash and role are required." });

        if (!AdminRoleExtensions.IsValidRole(dto.Role))
            return Results.BadRequest(new { error = "role must be admin or super_admin." });

        var username = dto.Username.Trim();
        var email = dto.Email.Trim().ToLowerInvariant();

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        if (await db.Admins.AnyAsync(x => x.Username == username, cancellationToken))
            return Results.BadRequest(new { error = "username already exists." });
        if (await db.Admins.AnyAsync(x => x.Email == email, cancellationToken))
            return Results.BadRequest(new { error = "email already exists." });

        var entity = new Admin
        {
            Id = dto.Id ?? Guid.Empty,
            Username = username,
            Email = email,
            PasswordHash = dto.PasswordHash.Trim(),
            Role = AdminRoleExtensions.ParseRole(dto.Role),
            LastLoginAt = dto.LastLoginAt,
        };

        db.Admins.Add(entity);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Results.BadRequest(new { error = "username or email already exists." });
        }

        return Results.Created($"/api/admin/admins/{entity.Id}", AdminEntityResponses.Admin(entity));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        AdminWriteDto dto,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Admins.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Username))
        {
            var username = dto.Username.Trim();
            if (await db.Admins.AnyAsync(x => x.Username == username && x.Id != id, cancellationToken))
                return Results.BadRequest(new { error = "username already exists." });
            entity.Username = username;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await db.Admins.AnyAsync(x => x.Email == email && x.Id != id, cancellationToken))
                return Results.BadRequest(new { error = "email already exists." });
            entity.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(dto.PasswordHash))
            entity.PasswordHash = dto.PasswordHash.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Role))
        {
            if (!AdminRoleExtensions.IsValidRole(dto.Role))
                return Results.BadRequest(new { error = "role must be admin or super_admin." });
            entity.Role = AdminRoleExtensions.ParseRole(dto.Role);
        }

        if (dto.LastLoginAt.HasValue)
            entity.LastLoginAt = dto.LastLoginAt;

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Results.BadRequest(new { error = "username or email already exists." });
        }

        return Results.Ok(AdminEntityResponses.Admin(entity));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Admins.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        db.Admins.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private sealed record AdminWriteDto(
        Guid? Id,
        string? Username,
        string? Email,
        string? PasswordHash,
        string? Role,
        DateTimeOffset? LastLoginAt);
}
