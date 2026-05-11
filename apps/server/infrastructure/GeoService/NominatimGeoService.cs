using System.Globalization;

namespace infrastructure.GeoService;

public class NominatimGeoService : IGeoProvider
{
    private static readonly HttpClient HttpClient = new();

    public async Task<string> GeoReverse(double lat, double lng)
    {
        var latString = lat.ToString(CultureInfo.InvariantCulture);
        var lngString = lng.ToString(CultureInfo.InvariantCulture);

        var url =
            $"https://nominatim.openstreetmap.org/reverse" +
            $"?lat={latString}" +
            $"&lon={lngString}" +
            $"&format=jsonv2" +
            $"&accept-language=uk" +
            $"&email=ilmo2004321@gmail.com";

        HttpClient.DefaultRequestHeaders.Clear();

        HttpClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "User-Agent",
            "UniMap/1.0 (student educational project; contact: ilmo2004321@gmail.com)"
        );

        HttpClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "Referer",
            "http://localhost:5286"
        );

        HttpClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "Accept",
            "application/json"
        );
        
        var response = await HttpClient.GetAsync(url);
        var addressJson = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Nominatim error: {(int)response.StatusCode} {response.ReasonPhrase}. Body: {addressJson}"
            );
        }

        return addressJson;
    }
}