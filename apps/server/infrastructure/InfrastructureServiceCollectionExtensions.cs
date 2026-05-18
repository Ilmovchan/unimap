using System.Net;
using app.Abstractions;
using app.Caching;
using domain.Abstractions;
using infrastructure.Auth;
using infrastructure.Caching;
using infrastructure.Geo;
using infrastructure.Jwt;
using infrastructure.Map;
using infrastructure.Routing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<MapTilerOptions>(configuration.GetSection(MapTilerOptions.SectionName));
        services.Configure<OpenRouteServiceOptions>(configuration.GetSection(OpenRouteServiceOptions.SectionName));

        var mapCacheMb = configuration.GetValue(
            $"{MapTilerOptions.SectionName}:Cache:SizeLimitMb",
            256);
        services.AddMemoryCache(memoryCacheOptions =>
        {
            memoryCacheOptions.SizeLimit = Math.Max(32, mapCacheMb) * 1024L * 1024L;
        });

        services.AddHttpClient("MapTiler", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
        })
        .RemoveAllLoggers()
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.All,
        });
        services.AddHttpClient("OpenRouteService", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
        });

        services.AddSingleton<IMapStyleService, MapTilerStyleService>();
        services.AddSingleton<MapTilerProxyService>();

        services.AddSingleton<IJwtTokenProvider, JwtTokenProvider>();
        services.AddSingleton<IAdminPasswordHasher, AdminPasswordHasher>();

        AddUserApiRedisCache(services, configuration);
        AddCachedNavigationProviders(services);

        return services;
    }

    private static void AddUserApiRedisCache(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<UserApiCacheOptions>(configuration.GetSection(UserApiCacheOptions.SectionName));

        var redisOptions = configuration.GetSection(UserApiCacheOptions.SectionName).Get<UserApiCacheOptions>()
            ?? new UserApiCacheOptions();
        var connectionString = configuration.GetConnectionString("Redis")
            ?? configuration[$"{UserApiCacheOptions.SectionName}:ConnectionString"];

        if (redisOptions.Enabled && !string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = connectionString;
                options.InstanceName = redisOptions.InstanceName;
            });
            services.AddSingleton<IConnectionMultiplexer>(_ =>
                ConnectionMultiplexer.Connect(connectionString));
            services.AddSingleton<IUserApiCache, RedisUserApiCache>();
        }
        else
        {
            services.AddSingleton<IUserApiCache, NullUserApiCache>();
        }

        services.AddSingleton<IUserApiCacheInvalidator, UserApiCacheInvalidator>();
    }

    private static void AddCachedNavigationProviders(IServiceCollection services)
    {
        services.AddScoped<OpenRouteServiceRoutingProvider>();
        services.AddScoped<IRoutingProvider, CachedRoutingProvider>();

        services.AddScoped<NominatimGeoProvider>();
        services.AddScoped<IGeoProvider, CachedGeoProvider>();
    }
}
