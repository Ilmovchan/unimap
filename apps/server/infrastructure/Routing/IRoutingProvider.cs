namespace infrastructure.Routing;

public interface IRoutingProvider
{
    Task<OpenRouteResponse?> NavigateAsync(        
        double startLat, double startLng,
        double endLat, double endLng,
        string profile = "driving-car");
}