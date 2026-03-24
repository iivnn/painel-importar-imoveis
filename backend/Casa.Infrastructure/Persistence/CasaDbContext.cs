using Casa.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence;

public class CasaDbContext(DbContextOptions<CasaDbContext> options) : DbContext(options)
{
    public DbSet<PropertyListing> PropertyListings => Set<PropertyListing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PropertyListing>(entity =>
        {
            entity.ToTable("PropertyListings");
            entity.HasKey(property => property.Id);

            entity.Property(property => property.Title)
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(property => property.Category)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(property => property.AddressLine)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(property => property.Neighborhood)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(property => property.City)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(property => property.State)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(property => property.PostalCode)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(property => property.Source)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(property => property.OriginalUrl)
                .HasMaxLength(500);

            entity.Property(property => property.SwotStatus)
                .HasMaxLength(60)
                .IsRequired();
        });
    }
}
