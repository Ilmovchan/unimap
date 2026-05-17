namespace infrastructure.GeoService;

public class OpenRouteGeoProvider : IGeoProvider
{
    private static readonly HttpClient HttpClient = new();

    private const string Apikey = 
        "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExYWViZDk1OTIwNDRlOGQ5ZWRiYmE0MmUwNDc5YjNlIiwiaCI6Im11cm11cjY0In0=";
    
    public async Task<string> GeoReverse(double lat, double lng)
    {
        var url =
            $"https://api.openrouteservice.org/geocode/reverse" +
            $"?api_key={Apikey}" +
            $"&point.lon={lng}" +
            $"&point.lat={lat}" +
            $"&size=1";

        var response = await HttpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var addressJson = await response.Content.ReadAsStringAsync();

        return addressJson;
    }
}