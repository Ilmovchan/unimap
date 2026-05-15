using app.Abstractions;
using domain.Entities;
using Unimap.Domain.Abstractions;

namespace app.Services;

public sealed class NewsService(INewsRepository newsRepository) : INewsService
{
    public Task<IReadOnlyList<News>> GetActiveNewsAsync(
        CancellationToken cancellationToken = default)
    {
        return newsRepository.GetActiveAsync(cancellationToken);
    }
}
