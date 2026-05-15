using domain.Entities;

namespace domain;

/// <summary>
/// Визначення ключа маркера за типом локації.
/// </summary>
public static class LocationTypeMarkerResolver
{
    private const string MarkerBuilding = "building";
    private const string MarkerLibrary = "library";
    private const string MarkerStadium = "stadium";
    private const string MarkerAdmin = "admin";
    private const string MarkerDefault = "default";
    private const string MarkerInfo = "info";

    public static string Resolve(LocationType locationType)
    {
        if (!string.IsNullOrWhiteSpace(locationType.MarkerKey))
            return locationType.MarkerKey.Trim().ToLowerInvariant();

        var fromCode = ResolveFromCode(locationType.Code);
        if (fromCode is not null)
            return fromCode;

        return ResolveFromNameUk(locationType.TitleUk);
    }

    public static string? ResolveFromCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        return code.Trim().ToLowerInvariant() switch
        {
            "library" => MarkerLibrary,
            "stadium" => MarkerStadium,
            "dormitory" => MarkerBuilding,
            "building" => MarkerBuilding,
            "other" => MarkerDefault,
            _ => null,
        };
    }

    public static string ResolveFromNameUk(string? nameUk)
    {
        if (string.IsNullOrWhiteSpace(nameUk))
            return MarkerBuilding;

        var t = nameUk.Trim().ToLowerInvariant();

        if (ContainsAny(t, "бібліотек", "library"))
            return MarkerLibrary;

        if (ContainsAny(t, "стадіон", "stadium", "спортив"))
            return MarkerStadium;

        if (ContainsAny(t, "гуртожит", "dormitory"))
            return MarkerBuilding;

        if (ContainsAny(t, "адміністратив"))
            return MarkerAdmin;

        if (ContainsAny(t, "інш"))
            return MarkerDefault;

        if (IsGenericBuildingOrCampus(t))
            return MarkerBuilding;

        if (IsAdmissionCommission(t))
            return MarkerInfo;

        return MarkerBuilding;
    }

    private static bool IsGenericBuildingOrCampus(string normalizedTitle)
    {
        return ContainsAny(
            normalizedTitle,
            "будівл",
            "будивл",
            "building",
            "корпус",
            "гуртожит",
            "навчальн",
            "споруд");
    }

    private static bool IsAdmissionCommission(string normalizedTitle)
    {
        if (ContainsAny(normalizedTitle, "admission", "enrollment office"))
            return true;

        if (!normalizedTitle.Contains("приймальн", StringComparison.Ordinal))
            return false;

        return normalizedTitle.Contains("коміс", StringComparison.Ordinal);
    }

    private static bool ContainsAny(string normalizedTitle, params string[] needles)
    {
        foreach (var n in needles)
        {
            if (normalizedTitle.Contains(n, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
