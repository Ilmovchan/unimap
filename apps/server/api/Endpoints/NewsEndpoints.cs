using app.Abstractions;
using domain.Entities;

namespace api.Endpoints;

public static class NewsEndpoints
{
    public static void MapNewsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/news", GetNewsAsync);
    }

    private static async Task<IResult> GetNewsAsync(
        INewsService newsService,
        CancellationToken cancellationToken)
    {
        var items = await newsService.GetActiveNewsAsync(cancellationToken);
        return Results.Ok(items.Select(NewsItem));
    }

    private static object NewsItem(News news) =>
        new
        {
            news.Id,
            news.Title,
            content = news.Content,
            news.IsActive,
            createdAt = news.CreatedAt,
            updatedAt = news.UpdatedAt,
        };
}
