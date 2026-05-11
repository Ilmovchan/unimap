using System.Text.Json;
using infrastructure.Dto;

namespace infrastructure.RoutingService;

public class OpenRouteServiceRouter : IRoutingProvider
{
    private static readonly HttpClient HttpClient = new();

    private const string Apikey = 
        "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExYWViZDk1OTIwNDRlOGQ5ZWRiYmE0MmUwNDc5YjNlIiwiaCI6Im11cm11cjY0In0=";

    public async Task<OpenRouteResponse?> NavigateAsync(
        double startLat, double startLng,
        double endLat, double endLng,
        string profile = "")
    {
        var url =
            $"https://api.openrouteservice.org/v2/directions/{profile}" +
            $"?api_key={Apikey}" +
            $"&start={startLng},{startLat}" +
            $"&end={endLng},{endLat}";

        HttpClient.DefaultRequestHeaders.Clear();
        HttpClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "Accept",
            "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8"
        );

        var response = await HttpClient.GetAsync(url);

        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OpenRouteService error: {(int)response.StatusCode} {response.ReasonPhrase}. Body: {responseData}"
            );
        }

        var data = JsonSerializer.Deserialize<OpenRouteResponse>(
            responseData,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }
        );

        return data;
    }
}