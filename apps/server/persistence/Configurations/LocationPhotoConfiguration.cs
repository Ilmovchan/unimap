using domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace persistence.Configurations;

public sealed class LocationPhotoConfiguration : IEntityTypeConfiguration<LocationPhoto>
{
    public void Configure(EntityTypeBuilder<LocationPhoto> builder)
    {
        builder.ToTable("location_photo");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.LocationId)
            .HasColumnName("location_id")
            .IsRequired();

        builder.Property(x => x.ImageUrl)
            .HasColumnName("image_url")
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(x => x.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.AltUk)
            .HasColumnName("alt_uk")
            .HasMaxLength(500);

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasOne(x => x.Location)
            .WithMany(x => x.Photos)
            .HasForeignKey(x => x.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.LocationId);

        builder.HasIndex(x => x.StorageKey)
            .IsUnique();
    }
}
