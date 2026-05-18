namespace infrastructure.Jwt;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "unimap";

    public string Audience { get; set; } = "unimap-admin";

    public string SigningKey { get; set; } = string.Empty;

    public string CookieName { get; set; } = "unimap_admin_token";

    public int ExpireMinutes { get; set; } = 10080; //7 days
}
