using System.Text.Json.Serialization;

namespace infrastructure.Routing;

public class OpenRouteResponse
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("bbox")]
    public List<double> Bbox { get; set; } = new();

    [JsonPropertyName("features")]
    public List<RouteFeature> Features { get; set; } = new();

    [JsonPropertyName("metadata")]
    public RouteMetadata Metadata { get; set; } = new();
}

public class RouteFeature
{
    [JsonPropertyName("bbox")]
    public List<double> Bbox { get; set; } = new();

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("properties")]
    public RouteProperties Properties { get; set; } = new();

    [JsonPropertyName("geometry")]
    public RouteGeometry Geometry { get; set; } = new();
}

public class RouteProperties
{
    [JsonPropertyName("segments")]
    public List<RouteSegment> Segments { get; set; } = new();

    [JsonPropertyName("way_points")]
    public List<int> WayPoints { get; set; } = new();

    [JsonPropertyName("summary")]
    public RouteSummary Summary { get; set; } = new();
}

public class RouteSegment
{
    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    [JsonPropertyName("steps")]
    public List<RouteStep> Steps { get; set; } = new();
}

public class RouteStep
{
    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    [JsonPropertyName("type")]
    public int Type { get; set; }

    [JsonPropertyName("instruction")]
    public string Instruction { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("way_points")]
    public List<int> WayPoints { get; set; } = new();
}

public class RouteSummary
{
    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }
}

public class RouteGeometry
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    // coordinates: [lng, lat]
    [JsonPropertyName("coordinates")]
    public List<List<double>> Coordinates { get; set; } = new();
}

public class RouteMetadata
{
    [JsonPropertyName("attribution")]
    public string Attribution { get; set; } = string.Empty;

    [JsonPropertyName("service")]
    public string Service { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("query")]
    public RouteQuery Query { get; set; } = new();

    [JsonPropertyName("engine")]
    public RouteEngine Engine { get; set; } = new();
}

public class RouteQuery
{
    [JsonPropertyName("coordinates")]
    public List<List<double>> Coordinates { get; set; } = new();

    [JsonPropertyName("profile")]
    public string Profile { get; set; } = string.Empty;

    [JsonPropertyName("profileName")]
    public string ProfileName { get; set; } = string.Empty;

    [JsonPropertyName("format")]
    public string Format { get; set; } = string.Empty;
}

public class RouteEngine
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("build_date")]
    public string BuildDate { get; set; } = string.Empty;

    [JsonPropertyName("graph_date")]
    public string GraphDate { get; set; } = string.Empty;

    [JsonPropertyName("osm_date")]
    public string OsmDate { get; set; } = string.Empty;
}