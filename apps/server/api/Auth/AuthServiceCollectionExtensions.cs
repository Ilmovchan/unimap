using System.Text;
using infrastructure.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace api.Auth;

public static class AuthServiceCollectionExtensions
{
    public static IServiceCollection AddJwtCookieAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(jwtSection);

        var jwtOptions = jwtSection.Get<JwtOptions>()
            ?? throw new InvalidOperationException($"Configuration section '{JwtOptions.SectionName}' is missing.");

        if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey) || jwtOptions.SigningKey.Length < 32)
            throw new InvalidOperationException("Jwt:SigningKey must be at least 32 characters.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                    ClockSkew = TimeSpan.FromMinutes(1),
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (context.Request.Cookies.TryGetValue(jwtOptions.CookieName, out var token))
                            context.Token = token;

                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthPolicies.SuperAdmin,
                policy => policy.RequireRole("super_admin"));
        });

        return services;
    }
}
