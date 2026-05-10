using Unimap.App.Abstractions;
using Unimap.Domain.Abstractions;
using Unimap.Domain.Entities;

namespace Unimap.App.Services;

public sealed class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departmentRepository;

    public DepartmentService(IDepartmentRepository departmentRepository)
    {
        _departmentRepository = departmentRepository;
    }

    public Task<IReadOnlyList<Department>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        return _departmentRepository.GetAllAsync(cancellationToken);
    }

    public Task<Department?> GetDepartmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _departmentRepository.GetByIdAsync(id, cancellationToken);
    }
}

