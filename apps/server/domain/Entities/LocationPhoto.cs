namespace domain.Entities;

public sealed class LocationPhoto : ITimestampedEntity
{
    public Guid Id { get; set; }

    public Guid LocationId { get; set; }

    public Location Location { get; set; } = null!;

    public string ImageUrl { get; set; } = string.Empty;

    public string StorageKey { get; set; } = string.Empty;

    public string? AltUk { get; set; }

    public bool IsMain { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
