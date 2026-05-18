namespace infrastructure.Geo;

public interface IGeoProvider
{
    Task<string> GeoReverse(double lat, double lng);
}