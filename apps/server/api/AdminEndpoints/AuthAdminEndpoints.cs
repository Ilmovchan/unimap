using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using infrastructure.Auth;
using infrastructure.Jwt;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using persistence;

namespace api.AdminEndpoints;

public static class AuthAdminEndpoints
{
    public static void MapAuthAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/login", LoginAsync);
        group.MapPost("/logout", Logout);
        group.MapGet("/me", MeAsync).RequireAuthorization();
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        IDbContextFactory<UniMapDbContext> dbFactory,
        IJwtTokenService jwtTokenService,
        IAdminPasswordHasher passwordHasher,
        IOptions<JwtOptions> jwtOptions,
        IHostEnvironment environment,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return Results.BadRequest(new { error = "email and password are required." });

        var email = request.Email.Trim().ToLowerInvariant();

        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var admin = await db.Admins.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (admin is null || !passwordHasher.Verify(request.Password, admin.PasswordHash))
            return Results.Unauthorized();

        var options = jwtOptions.Value;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(options.ExpireMinutes);
        var token = jwtTokenService.CreateToken(admin, expiresAt);

        admin.LastLoginAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        httpContext.Response.Cookies.Append(
            options.CookieName,
            token,
            CreateCookieOptions(expiresAt, environment.IsProduction()));

        return Results.Ok(AdminEntityResponses.AdminPublic(admin));
    }

    private static IResult Logout(
        IOptions<JwtOptions> jwtOptions,
        IHostEnvironment environment,
        HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(
            jwtOptions.Value.CookieName,
            CreateCookieOptions(DateTimeOffset.UtcNow, environment.IsProduction()));

        return Results.NoContent();
    }

    private static IResult MeAsync(HttpContext httpContext)
    {
        var principal = httpContext.User;
        if (principal.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Results.Ok(new
        {
            id,
            email = principal.FindFirstValue(ClaimTypes.Email)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.Email),
            username = principal.FindFirstValue(ClaimTypes.Name)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.UniqueName),
            role = principal.FindFirstValue(ClaimTypes.Role),
        });
    }

    private static CookieOptions CreateCookieOptions(DateTimeOffset expires, bool isProduction) =>
        new()
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expires,
        };

    private sealed record LoginRequest(string Email, string Password);
}
