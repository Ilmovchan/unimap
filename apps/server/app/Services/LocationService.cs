using app.Abstractions;
using domain.Abstractions.Public;
using domain.Dto;
using domain.Entities;

namespace app.Services;

public sealed class LocationService : ILocationService
{
    private readonly ILocationPublicRepository _locationRepository;

    public LocationService(ILocationPublicRepository locationRepository)
    {
        _locationRepository = locationRepository;
    }

    public Task<IReadOnlyList<LocationMarkerDto>> GetLocationMarkersAsync(
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
