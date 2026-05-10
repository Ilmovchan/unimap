namespace Unimap.Domain.Entities;

public sealed class Department
{
    public Guid Id { get; set; }

    public double Lat { get; set; }

    public double Lng { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public string? AddressJson { get; set; } = string.Empty;

    public string? IconUrl { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

