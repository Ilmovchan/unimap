using System.Text.Json;
using Microsoft.Extensions.Options;

namespace infrastructure.Routing;

public class OpenRouteServiceRoutingProvider(
    IHttpClientFactory httpClientFactory,
    IOptions<OpenRouteServiceOptions> options) : IRoutingProvider
{
    public async Task<OpenRouteResponse?> NavigateAsync(
        double startLat, double startLng,
        double endLat, double endLng,
        string profile = "")
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.ApiKey))
        {
            throw new InvalidOperationException("ExternalApis:OpenRouteService:ApiKey is not configured.");
        }

        var profileSegment = string.IsNullOrWhiteSpace(profile) ? "foot-walking" : profile.Trim();
        var url =
            $"{opts.BaseUrl.TrimEnd('/')}/v2/directions/{profileSegment}" +
            $"?api_key={Uri.EscapeDataString(opts.ApiKey)}" +
            $"&start={startLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{startLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
            $"&end={endLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{endLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}";

        var client = httpClientFactory.CreateClient("OpenRouteService");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.TryAddWithoutValidation(
            "Accept",
            "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8");

        var response = await client.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OpenRouteService error: {(int)response.StatusCode} {response.ReasonPhrase}. Body: {responseData}");
        }

        return JsonSerializer.Deserialize<OpenRouteResponse>(
            responseData,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            });
    }
}
