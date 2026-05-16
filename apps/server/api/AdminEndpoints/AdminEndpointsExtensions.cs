namespace api.AdminEndpoints;

public static class AdminEndpointsExtensions
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin");

        group.MapLocationTypeAdminEndpoints();
        group.MapLocationAdminEndpoints();
        group.MapUniversityObjectTypeAdminEndpoints();
        group.MapUniversityObjectAdminEndpoints();
        group.MapNewsAdminEndpoints();
        group.MapAdminAdminEndpoints();
    }
}
