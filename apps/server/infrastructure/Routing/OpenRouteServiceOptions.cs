namespace infrastructure.Routing;

public sealed class OpenRouteServiceOptions
{
    public const string SectionName = "ExternalApis:OpenRouteService";

    public string ApiKey { get; set; } = "";

    public string BaseUrl { get; set; } = "https://api.openrouteservice.org";
}
