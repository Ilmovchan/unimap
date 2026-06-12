namespace domain.Entities;

public sealed class Schedule
{
    public Guid Id { get; set; }

    public Guid LocationId { get; set; }

    public Location Location { get; set; } = null!;

    public int DayOfWeek { get; set; }

    public TimeOnly? OpeningAt { get; set; }

    public TimeOnly? ClosingAt { get; set; }

    public bool IsClosed { get; set; }
}
