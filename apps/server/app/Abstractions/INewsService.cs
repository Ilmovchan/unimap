using domain.Entities;

namespace app.Abstractions;

public interface INewsService
{
    Task<IReadOnlyList<News>> GetActiveNewsAsync(CancellationToken cancellationToken = default);
}
