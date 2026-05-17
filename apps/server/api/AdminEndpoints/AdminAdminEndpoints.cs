using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json.Serialization;
using domain.Entities;
using infrastructure.Auth;
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
        IAdminPasswordHasher passwordHasher,
        CancellationToken cancellationToken)
    {
        var plainPassword = ResolvePlainPassword(dto);
        if (string.IsNullOrWhiteSpace(dto.Username) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(plainPassword))
            return Results.BadRequest(new { error = "username, email and password are required." });

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
            PasswordHash = passwordHasher.Hash(plainPassword),
            Role = AdminRole.Admin,
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
        IAdminPasswordHasher passwordHasher,
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

        var plainPassword = ResolvePlainPassword(dto);
        if (!string.IsNullOrWhiteSpace(plainPassword))
            entity.PasswordHash = passwordHasher.Hash(plainPassword);

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
        HttpContext httpContext,
        IDbContextFactory<UniMapDbContext> dbFactory,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentAdminId(httpContext, out var currentAdminId))
            return Results.Unauthorized();

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var entity = await db.Admins.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Results.NotFound();

        var deleteError = GetAdminDeleteError(entity, currentAdminId);
        if (deleteError is not null)
            return Results.BadRequest(new { error = deleteError });

        db.Admins.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static string? GetAdminDeleteError(Admin target, Guid currentAdminId)
    {
        if (target.Id == currentAdminId)
            return "you cannot delete your own account.";

        if (target.Role == AdminRole.SuperAdmin)
            return "super_admin accounts cannot be deleted.";

        return null;
    }

    private static bool TryGetCurrentAdminId(HttpContext httpContext, out Guid adminId)
    {
        adminId = default;
        var idValue = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(idValue, out adminId);
    }

    private static string? ResolvePlainPassword(AdminWriteDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Password))
            return dto.Password.Trim();
        if (!string.IsNullOrWhiteSpace(dto.PasswordHash))
            return dto.PasswordHash.Trim();
        return null;
    }

    private sealed record AdminWriteDto(
        Guid? Id,
        string? Username,
        string? Email,
        [property: JsonPropertyName("passwordHash")] string? PasswordHash,
        [property: JsonPropertyName("password")] string? Password,
        string? Role,
        DateTimeOffset? LastLoginAt);
}
