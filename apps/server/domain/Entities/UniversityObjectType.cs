namespace domain.Entities;

public sealed class UniversityObjectType : ITimestampedEntity
{
    public Guid Id { get; set; }
    
    public string Code { get; set; } = string.Empty;
    
    public string TitleUk { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<UniversityObject> UniversityObjects { get; set; } =
        new List<UniversityObject>();
}
