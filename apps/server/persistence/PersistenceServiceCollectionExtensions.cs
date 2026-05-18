using domain.Abstractions.Admin;
using domain.Abstractions.Public;
using Microsoft.Extensions.DependencyInjection;
using persistence.Repositories.Admin;
using persistence.Repositories.Public;

namespace persistence;

public static class PersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services)
    {
        services.AddScoped<ILocationPublicRepository, LocationPublicRepository>();
        services.AddScoped<INewsPublicRepository, NewsPublicRepository>();

        services.AddScoped<IAdminLocationRepository, AdminLocationRepository>();
        services.AddScoped<IAdminLocationPhotoRepository, AdminLocationPhotoRepository>();
        services.AddScoped<IAdminLocationTypeRepository, AdminLocationTypeRepository>();
        services.AddScoped<IAdminUniversityObjectRepository, AdminUniversityObjectRepository>();
        services.AddScoped<IAdminUniversityObjectTypeRepository, AdminUniversityObjectTypeRepository>();
        services.AddScoped<IAdminNewsRepository, AdminNewsRepository>();
        services.AddScoped<IAdminAccountRepository, AdminAccountRepository>();

        return services;
    }
}
