namespace app.Abstractions;

public interface IUserApiCacheInvalidator
{
    Task InvalidateLocationsAsync(CancellationToken cancellationToken = default);

    Task InvalidateLocationDetailAsync(Guid locationId, CancellationToken cancellationToken = default);

    Task InvalidateNewsAsync(CancellationToken cancellationToken = default);

    Task InvalidateNavigationAsync(CancellationToken cancellationToken = default);
}
