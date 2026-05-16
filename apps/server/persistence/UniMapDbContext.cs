using domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace persistence;

public sealed class UniMapDbContext : DbContext
{
    public UniMapDbContext(DbContextOptions<UniMapDbContext> options)
        : base(options)
    {
    }

    public DbSet<LocationType> LocationTypes => Set<LocationType>();

    public DbSet<Location> Locations => Set<Location>();

    public DbSet<UniversityObjectType> UniversityObjectTypes => Set<UniversityObjectType>();

    public DbSet<UniversityObject> UniversityObjects => Set<UniversityObject>();

    public DbSet<News> News => Set<News>();

    public DbSet<Admin> Admins => Set<Admin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(UniMapDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        TouchTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        TouchTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void TouchTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<ITimestampedEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                foreach (var p in entry.Properties)
                {
                    if (p.Metadata.Name == "Id" && p.CurrentValue is Guid g && g == Guid.Empty)
                        p.CurrentValue = Guid.NewGuid();
                }

                if (entry.Entity.CreatedAt == default)
                    entry.Entity.CreatedAt = now;

                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
