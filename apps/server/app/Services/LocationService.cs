using app.Abstractions;
using domain.Entities;
using domain.Models;
using Unimap.Domain.Abstractions;

namespace app.Services;

public sealed class LocationService : ILocationService
{
    private readonly ILocationRepository _locationRepository;

    public LocationService(ILocationRepository locationRepository)
    {
        _locationRepository = locationRepository;
    }

    public Task<IReadOnlyList<LocationMarker>> GetLocationMarkersAsync(
        CancellationToken cancellationToken = default)
    {
        return _locationRepository.GetMarkersAsync(cancellationToken);
    }

    public Task<IReadOnlyList<Location>> GetLocationsListAsync(
        CancellationToken cancellationToken = default)
    {
        return _locationRepository.GetAllWithDetailsAsync(cancellationToken);
    }

    public Task<Location?> GetLocationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _locationRepository.GetByIdWithDetailsAsync(id, cancellationToken);
    }
}
