using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json.Serialization;
using app.Abstractions.Administration;
using app.Models.Admin;

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
        IAdminAccountService service,
        CancellationToken cancellationToken)
    {
        var items = await service.ListAsync(cancellationToken);
        return Results.Ok(items.Select(AdminEntityResponses.Admin));
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IAdminAccountService service,
        CancellationToken cancellationToken)
    {
        var entity = await service.GetByIdAsync(id, cancellationToken);
        return entity is null ? Results.NotFound() : Results.Ok(AdminEntityResponses.Admin(entity));
    }

    private static async Task<IResult> CreateAsync(
        AdminWriteDto dto,
        IAdminAccountService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(
            new AdminAccountCreateCommand(
                dto.Id,
                dto.Username,
                dto.Email,
                dto.Password,
                dto.PasswordHash,
                dto.LastLoginAt),
            cancellationToken);

        return result.ToHttpResult(entity =>
            Results.Created($"/api/admin/admins/{entity.Id}", AdminEntityResponses.Admin(entity)));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        AdminWriteDto dto,
        IAdminAccountService service,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(
            id,
            new AdminAccountUpdateCommand(
                dto.Username,
                dto.Email,
                dto.Password,
                dto.PasswordHash,
                dto.LastLoginAt),
            cancellationToken);

        return result.ToHttpResult(entity => Results.Ok(AdminEntityResponses.Admin(entity)));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        HttpContext httpContext,
        IAdminAccountService service,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentAdminId(httpContext, out var currentAdminId))
            return Results.Unauthorized();

        var result = await service.DeleteAsync(id, currentAdminId, cancellationToken);
        return result.ToHttpResult(() => Results.NoContent());
    }

    private static bool TryGetCurrentAdminId(HttpContext httpContext, out Guid adminId)
    {
        adminId = default;
        var idValue = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(idValue, out adminId);
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
