using app.Abstractions;
using domain.Abstractions.Public;
using domain.Entities;

namespace app.Services;

public sealed class NewsService(INewsPublicRepository newsRepository) : INewsService
{
    public Task<IReadOnlyList<News>> GetActiveNewsAsync(
        CancellationToken cancellationToken = default)
    {
        return newsRepository.GetActiveAsync(cancellationToken);
    }
}
