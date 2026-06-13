using domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace persistence.Configurations;

public sealed class UniversityObjectConfiguration : IEntityTypeConfiguration<UniversityObject>
{
    public void Configure(EntityTypeBuilder<UniversityObject> builder)
    {
        builder.ToTable("university_object");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.LocationId)
            .HasColumnName("location_id")
            .IsRequired();

        builder.Property(x => x.ObjectTypeId)
            .HasColumnName("object_type_id")
            .IsRequired();

        builder.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(4000);

        builder.Property(x => x.Manager)
            .HasColumnName("manager")
            .HasMaxLength(500);

        builder.Property(x => x.PhoneNumber)
            .HasColumnName("phone_number")
            .HasMaxLength(64);

        builder.Property(x => x.WebUrl)
            .HasColumnName("web_url")
            .HasMaxLength(2000);

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasOne(x => x.Location)
            .WithMany(x => x.UniversityObjects)
            .HasForeignKey(x => x.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ObjectType)
            .WithMany(x => x.UniversityObjects)
            .HasForeignKey(x => x.ObjectTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.LocationId);
        builder.HasIndex(x => x.ObjectTypeId);
        builder.HasIndex(x => x.Title);
    }
}
