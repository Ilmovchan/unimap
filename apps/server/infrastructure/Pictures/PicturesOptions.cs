namespace infrastructure.Pictures;

public sealed class PicturesOptions
{
    public const string SectionName = "Pictures";

    /// <summary>LocalFile | S3 (майбутнє).</summary>
    public string Provider { get; set; } = "LocalFile";

    /// <summary>Корінь файлів відносно ContentRoot (напр. <c>pictures</c>).</summary>
    public string LocalRootPath { get; set; } = "pictures";

    /// <summary>
    /// Базовий публічний URL API (напр. <c>https://api.example.com</c>).
    /// Якщо порожній — береться з поточного HTTP-запиту.
    /// </summary>
    public string? PublicBaseUrl { get; set; }
}
