using Unimap.Domain.Entities;

namespace Unimap.Domain.Abstractions;

public interface IDepartmentRepository
{
    Task<IReadOnlyList<Department>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Department?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

