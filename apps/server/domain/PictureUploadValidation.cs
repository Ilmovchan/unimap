namespace domain;

public static class PictureUploadValidation
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg" };

    public static bool IsAllowedImage(string? contentType, string fileName)
    {
        if (!string.IsNullOrWhiteSpace(contentType)
            && contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var ext = Path.GetExtension(fileName);
        return !string.IsNullOrWhiteSpace(ext) && AllowedExtensions.Contains(ext);
    }
}
