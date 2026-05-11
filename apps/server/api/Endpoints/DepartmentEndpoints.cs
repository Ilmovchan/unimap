using app.Abstractions;

namespace api.Endpoints;

public static class DepartmentEndpoints
{
    public static void MapDepartmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/departments");

        group.MapGet("/", GetDepartmentsAsync);
        group.MapGet("/{id:guid}", GetDepartmentByIdAsync);
    }

    private static async Task<IResult> GetDepartmentsAsync(
        IDepartmentService departmentService,
        CancellationToken cancellationToken)
    {
        var departments = await departmentService.GetDepartmentsAsync(cancellationToken);
        return Results.Ok(departments);
    }

    private static async Task<IResult> GetDepartmentByIdAsync(
        Guid id,
        IDepartmentService departmentService,
        CancellationToken cancellationToken)
    {
        var department = await departmentService.GetDepartmentByIdAsync(id, cancellationToken);
        return department is null ? Results.NotFound() : Results.Ok(department);
    }
}

