namespace domain.Entities;

public sealed class LocationType : ITimestampedEntity
{
    public Guid Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string TitleUk { get; set; } = string.Empty;

    public string MarkerKey { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Location> Locations { get; set; } = new List<Location>();
}
