using domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace persistence.Configurations;

public sealed class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.ToTable("schedule");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.LocationId)
            .HasColumnName("location_id")
            .IsRequired();

        builder.Property(x => x.DayOfWeek)
            .HasColumnName("day_of_week")
            .IsRequired();

        builder.Property(x => x.OpeningAt)
            .HasColumnName("opening_at")
            .HasColumnType("time without time zone");

        builder.Property(x => x.ClosingAt)
            .HasColumnName("closing_at")
            .HasColumnType("time without time zone");

        builder.Property(x => x.IsClosed)
            .HasColumnName("is_closed")
            .IsRequired();

        builder.HasOne(x => x.Location)
            .WithMany(x => x.Schedules)
            .HasForeignKey(x => x.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.LocationId);
        builder.HasIndex(x => new { x.LocationId, x.DayOfWeek })
            .IsUnique();
    }
}
