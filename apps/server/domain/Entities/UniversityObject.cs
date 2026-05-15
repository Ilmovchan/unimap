namespace domain.Entities;

public sealed class UniversityObject : ITimestampedEntity
{
    public Guid Id { get; set; }

    public Guid LocationId { get; set; }

    public Location Location { get; set; } = null!;

    public Guid ObjectTypeId { get; set; }

    public UniversityObjectType ObjectType { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
