using Casa.Domain.Entities;
using Casa.Domain.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence;

public class CasaDbContext(DbContextOptions<CasaDbContext> options) : DbContext(options)
{
    public DbSet<PropertyListing> PropertyListings => Set<PropertyListing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PropertyListing>(entity =>
        {
            var propertySourceConverter = new ValueConverter<PropertySource, string>(
                source => source.ToString(),
                source => ParsePropertySource(source));

            var propertySwotStatusConverter = new ValueConverter<PropertySwotStatus, string>(
                status => status.ToString(),
                status => ParsePropertySwotStatus(status));

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
                .HasConversion(propertySourceConverter)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(property => property.OriginalUrl)
                .HasMaxLength(500);

            entity.Property(property => property.SwotStatus)
                .HasConversion(propertySwotStatusConverter)
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(property => property.Excluded)
                .HasDefaultValue(false);
        });
    }

    private static PropertySource ParsePropertySource(string? source)
    {
        return source switch
        {
            "App externo" => PropertySource.AppExterno,
            "Portal web" => PropertySource.PortalWeb,
            "Indicacao" => PropertySource.Indicacao,
            "Corretor" => PropertySource.Corretor,
            "Outro" => PropertySource.Outro,
            _ when Enum.TryParse<PropertySource>(source, true, out var parsedSource) => parsedSource,
            _ => PropertySource.Outro
        };
    }

    private static PropertySwotStatus ParsePropertySwotStatus(string? status)
    {
        return status switch
        {
            "Em analise" => PropertySwotStatus.EmAnalise,
            "Novo" => PropertySwotStatus.Novo,
            "Favorito" => PropertySwotStatus.Favorito,
            "Pendente" => PropertySwotStatus.Pendente,
            "Descartado" => PropertySwotStatus.Descartado,
            _ when Enum.TryParse<PropertySwotStatus>(status, true, out var parsedStatus) => parsedStatus,
            _ => PropertySwotStatus.Novo
        };
    }
}
