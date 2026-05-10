using Unimap.Domain.Entities;

namespace Unimap.App.Abstractions;

public interface IDepartmentService
{
    Task<IReadOnlyList<Department>> GetDepartmentsAsync(CancellationToken cancellationToken = default);

    Task<Department?> GetDepartmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

