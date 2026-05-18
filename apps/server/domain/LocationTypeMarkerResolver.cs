using domain.Entities;

namespace domain;

/// <summary>
/// Визначення канонічного ключа маркера за типом локації (building, garden, library, …).
/// </summary>
public static class LocationTypeMarkerResolver
{
    private const string MarkerBuilding = "building";
    private const string MarkerLibrary = "library";
    private const string MarkerStadium = "stadium";
    private const string MarkerGarden = "garden";
    private const string MarkerCollege = "college";
    private const string MarkerDormitory = "dormitory";
    private const string MarkerAdmin = "admin";
    private const string MarkerDefault = "default";
    private const string MarkerInfo = "info";

    /// <summary>
    /// Канонічний ключ для клієнта (garden, building, …), незалежно від marker_key у БД.
    /// </summary>
    public static string CanonicalizeMarkerKey(string? rawMarkerKey, string? typeCode)
    {
        var fromCode = ResolveFromCode(typeCode);
        if (fromCode is not null)
            return fromCode;

        var fromStored = NormalizeStoredMarkerKey(rawMarkerKey);
        if (fromStored is not null)
            return fromStored;

        return MarkerBuilding;
    }

    public static string Resolve(LocationType locationType)
    {
        var fromCode = ResolveFromCode(locationType.Code);
        if (fromCode is not null)
            return fromCode;

        if (!string.IsNullOrWhiteSpace(locationType.MarkerKey))
        {
            var fromStored = NormalizeStoredMarkerKey(locationType.MarkerKey);
            if (fromStored is not null)
                return fromStored;
        }

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
            "garden" => MarkerGarden,
            "college" => MarkerCollege,
            "dormitory" => MarkerDormitory,
            "building" => MarkerBuilding,
            "other" => MarkerDefault,
            _ => null,
        };
    }

    /// <summary>
    /// Нормалізує marker_key з БД (наприклад garden_marker → garden).
    /// </summary>
    public static string? NormalizeStoredMarkerKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        var key = raw.Trim().ToLowerInvariant();
        if (key.EndsWith("_marker", StringComparison.Ordinal))
            key = key[..^"_marker".Length];

        return key switch
        {
            "library" or "lib" => MarkerLibrary,
            "stadium" or "sport" => MarkerStadium,
            "garden" => MarkerGarden,
            "college" => MarkerCollege,
            "dormitory" or "dorm" => MarkerDormitory,
            "building" or "uni" => MarkerBuilding,
            "admin" => MarkerAdmin,
            "info" => MarkerInfo,
            "default" or "other" => MarkerDefault,
            _ => InferFromMarkerKeyFragment(key),
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

        if (ContainsAny(t, "garden", "сад", "парк", "сквер", "ботанічн"))
            return MarkerGarden;

        if (ContainsAny(t, "гуртожит", "dormitory"))
            return MarkerDormitory;

        if (ContainsAny(t, "коледж", "college", "fakhov", "фахов"))
            return MarkerCollege;

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

    private static string? InferFromMarkerKeyFragment(string key)
    {
        if (key.Contains("library", StringComparison.Ordinal))
            return MarkerLibrary;
        if (key.Contains("stadium", StringComparison.Ordinal) || key.Contains("sport", StringComparison.Ordinal))
            return MarkerStadium;
        if (key.Contains("garden", StringComparison.Ordinal))
            return MarkerGarden;
        if (key.Contains("college", StringComparison.Ordinal) || key.Contains("коледж", StringComparison.Ordinal))
            return MarkerCollege;
        if (key.Contains("dorm", StringComparison.Ordinal))
            return MarkerDormitory;
        if (key.Contains("admin", StringComparison.Ordinal))
            return MarkerAdmin;
        if (key.Contains("info", StringComparison.Ordinal))
            return MarkerInfo;
        if (key.Contains("default", StringComparison.Ordinal) || key.Contains("other", StringComparison.Ordinal))
            return MarkerDefault;
        if (key.Contains("building", StringComparison.Ordinal) || key.Contains("uni", StringComparison.Ordinal))
            return MarkerBuilding;

        return null;
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
