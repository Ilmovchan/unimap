namespace infrastructure.Map;

public sealed class MapTilerOptions
{
    public const string SectionName = "ExternalApis:MapTiler";

    public string ApiKey { get; set; } = "";

    /// <summary>URL стилю MapTiler (без ключа в query — ключ додається на сервері).</summary>
    public string StylePath { get; set; } = "/maps/streets-v4-pastel/style.json";

    public string BaseUrl { get; set; } = "https://api.maptiler.com";

    public MapTilerCacheOptions Cache { get; set; } = new();
}

public sealed class MapTilerCacheOptions
{
    public bool Enabled { get; set; } = true;

    /// <summary>Ліміт памʼяті кешу (МБ).</summary>
    public int SizeLimitMb { get; set; } = 256;

    public int TileTtlHours { get; set; } = 168;

    public int FontTtlHours { get; set; } = 168;

    public int SpriteTtlHours { get; set; } = 24;

    public int JsonTtlMinutes { get; set; } = 60;

    public int StyleTtlMinutes { get; set; } = 60;
}
