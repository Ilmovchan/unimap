using domain.Entities;

namespace domain.Abstractions.Public;

public interface INewsPublicRepository
{
    Task<IReadOnlyList<News>> GetActiveAsync(CancellationToken cancellationToken = default);
}
