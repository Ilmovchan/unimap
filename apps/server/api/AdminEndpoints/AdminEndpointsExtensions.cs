using api.Auth;

namespace api.AdminEndpoints;

public static class AdminEndpointsExtensions
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin");

        admin.MapAuthAdminEndpoints();

        var secured = admin.MapGroup("").RequireAuthorization();

        secured.MapLocationTypeAdminEndpoints();
        secured.MapLocationAdminEndpoints();
        secured.MapLocationPhotoAdminEndpoints();
        secured.MapUniversityObjectTypeAdminEndpoints();
        secured.MapUniversityObjectAdminEndpoints();
        secured.MapNewsAdminEndpoints();

        var superAdmin = secured.MapGroup("").RequireAuthorization(AuthPolicies.SuperAdmin);
        superAdmin.MapAdminAdminEndpoints();
    }
}
