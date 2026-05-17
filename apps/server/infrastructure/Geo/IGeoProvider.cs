namespace infrastructure.GeoService;

public interface IGeoProvider
{
    Task<string> GeoReverse(double lat, double lng);
}