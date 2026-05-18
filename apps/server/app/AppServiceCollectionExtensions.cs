using app.Abstractions;
using app.Abstractions.Administration;
using app.Caching;
using app.Services;
using app.Services.Administration;
using app.Services.Caching;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace app;

public static class AppServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<UserApiCacheOptions>(configuration.GetSection(UserApiCacheOptions.SectionName));

        services.AddScoped<LocationService>();
        services.AddScoped<ILocationService, CachedLocationService>();
        services.AddScoped<NewsService>();
        services.AddScoped<INewsService, CachedNewsService>();

        services.AddScoped<IAdminLocationService, AdminLocationService>();
        services.AddScoped<IAdminLocationPhotoService, AdminLocationPhotoService>();
        services.AddScoped<IAdminLocationTypeService, AdminLocationTypeService>();
        services.AddScoped<IAdminUniversityObjectService, AdminUniversityObjectService>();
        services.AddScoped<IAdminUniversityObjectTypeService, AdminUniversityObjectTypeService>();
        services.AddScoped<IAdminNewsService, AdminNewsService>();
        services.AddScoped<IAdminAccountService, AdminAccountService>();
        services.AddScoped<IAdminAuthService, AdminAuthService>();

        return services;
    }
}
