using app.Abstractions;
using domain.Entities;
using Unimap.Domain.Abstractions;

namespace app.Services;

public sealed class LocationService : ILocationService
{
    private readonly ILocationRepository _locationRepository;

    public LocationService(ILocationRepository locationRepository)
    {
        _locationRepository = locationRepository;
    }

    public Task<IReadOnlyList<Location>> GetLocationsForMapAsync(
        CancellationToken cancellationToken = default)
    {
        return _locationRepository.GetAllForMapAsync(cancellationToken);
    }

    public Task<Location?> GetLocationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _locationRepository.GetByIdWithDetailsAsync(id, cancellationToken);
    }
}
