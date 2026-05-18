using domain.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace infrastructure.Pictures;

public static class PictureServiceCollectionExtensions
{
    public static IServiceCollection AddPictureStorage(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<PicturesOptions>(configuration.GetSection(PicturesOptions.SectionName));

        // Для S3: services.AddSingleton<IPictureProvider, S3PictureProvider>();
        services.AddSingleton<IPictureProvider, LocalFilePictureProvider>();

        return services;
    }
}
