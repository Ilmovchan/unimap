namespace app.Caching;

public sealed class UserApiCacheOptions
{
    public const string SectionName = "Redis";

    public bool Enabled { get; set; } = true;

    public string InstanceName { get; set; } = "unimap:";

    public int LocationsTtlMinutes { get; set; } = 30;

    public int NewsTtlMinutes { get; set; } = 10;

    public int NavigationTtlMinutes { get; set; } = 60;
}
