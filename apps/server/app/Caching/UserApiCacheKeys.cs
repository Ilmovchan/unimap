namespace app.Caching;

public static class UserApiCacheKeys
{
    public const string Prefix = "user-api:";

    public const string LocationsPrefix = Prefix + "locations:";

    public static string LocationMarkers() => LocationsPrefix + "markers";

    public static string LocationsList() => LocationsPrefix + "list";

    public static string LocationDetail(Guid id) => LocationsPrefix + "detail:" + id.ToString("N");

    public static string NewsActive() => Prefix + "news:active";

    public static string NavigationRoute(string profile, double startLat, double startLng, double endLat, double endLng) =>
        Prefix + "navigation:route:" +
        $"{profile}:{FormatCoord(startLat)}:{FormatCoord(startLng)}:{FormatCoord(endLat)}:{FormatCoord(endLng)}";

    public static string NavigationReverse(double lat, double lng) =>
        Prefix + "navigation:reverse:" + $"{FormatCoord(lat)}:{FormatCoord(lng)}";

    private static string FormatCoord(double value) =>
        value.ToString("F5", System.Globalization.CultureInfo.InvariantCulture);
}
