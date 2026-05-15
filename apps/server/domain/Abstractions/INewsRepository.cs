using domain.Entities;

namespace Unimap.Domain.Abstractions;

public interface INewsRepository
{
    Task<IReadOnlyList<News>> GetActiveAsync(CancellationToken cancellationToken = default);
}
