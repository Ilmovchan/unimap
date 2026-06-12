namespace domain.Entities;

public sealed class Location : ITimestampedEntity
{
    public Guid Id { get; set; }

    public Guid LocationTypeId { get; set; }

    public LocationType LocationType { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string? Description { get; set; }

    public string? AddressJson { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<UniversityObject> UniversityObjects { get; set; } =
        new List<UniversityObject>();

    public ICollection<LocationPhoto> Photos { get; set; } =
        new List<LocationPhoto>();

    public ICollection<Schedule> Schedules { get; set; } =
        new List<Schedule>();
}
