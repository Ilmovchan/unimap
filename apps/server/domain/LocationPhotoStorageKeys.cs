namespace domain;

public static class LocationPhotoStorageKeys
{
    public static string ForLocation(Guid locationId, string fileName) =>
        $"locations/{locationId:D}/{SanitizeFileName(fileName)}";

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName.Trim());
        if (string.IsNullOrWhiteSpace(name))
            return $"{Guid.NewGuid():N}.jpg";

        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? $"{Guid.NewGuid():N}.jpg" : cleaned;
    }
}
