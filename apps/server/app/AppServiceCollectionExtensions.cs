using app.Abstractions;
using app.Abstractions.Administration;
using app.Services;
using app.Services.Administration;
using Microsoft.Extensions.DependencyInjection;

namespace app;

public static class AppServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<INewsService, NewsService>();

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
