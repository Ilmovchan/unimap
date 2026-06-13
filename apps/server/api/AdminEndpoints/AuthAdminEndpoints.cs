using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using app.Abstractions.Administration;
using app.Models.Admin;
using infrastructure.Jwt;
using Microsoft.Extensions.Options;

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
        IAdminAuthService authService,
        IJwtTokenProvider jwtTokenService,
        IOptions<JwtOptions> jwtOptions,
        IHostEnvironment environment,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(
            new AdminLoginCommand(request.Email, request.Password),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return Results.Json(
                new { error = result.Error },
                statusCode: result.StatusCode);
        }

        var admin = result.Value!;
        var options = jwtOptions.Value;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(options.ExpireMinutes);
        var token = jwtTokenService.CreateToken(admin, expiresAt);

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
            CreateCookieOptions(
                DateTimeOffset.UtcNow.AddDays(-1),
                environment.IsProduction()));

        return Results.NoContent();
    }

    private static IResult MeAsync(HttpContext httpContext)
    {
        var principal = httpContext.User;

        if (principal.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var id =
            principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Results.Ok(new
        {
            id,
            email =
                principal.FindFirstValue(ClaimTypes.Email)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.Email),
            username =
                principal.FindFirstValue(ClaimTypes.Name)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.UniqueName),
            role = principal.FindFirstValue(ClaimTypes.Role),
        });
    }

    private static CookieOptions CreateCookieOptions(
        DateTimeOffset expires,
        bool isProduction)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction
                ? SameSiteMode.None
                : SameSiteMode.Lax,
            Path = "/",
            Expires = expires,
            IsEssential = true,
        };
    }

    private sealed record LoginRequest(string Email, string Password);
}