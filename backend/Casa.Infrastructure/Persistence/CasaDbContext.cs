using Casa.Domain.Entities;
using Casa.Domain.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence;

public class CasaDbContext(DbContextOptions<CasaDbContext> options) : DbContext(options)
{
    public DbSet<AppLogEntry> AppLogEntries => Set<AppLogEntry>();
    public DbSet<AppSettingsProfile> AppSettingsProfiles => Set<AppSettingsProfile>();
    public DbSet<DismissedPropertyInconsistency> DismissedPropertyInconsistencies => Set<DismissedPropertyInconsistency>();
    public DbSet<PropertyListing> PropertyListings => Set<PropertyListing>();
    public DbSet<PropertyAttachment> PropertyAttachments => Set<PropertyAttachment>();
    public DbSet<PropertyStatusHistory> PropertyStatusHistory => Set<PropertyStatusHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppLogEntry>(entity =>
        {
            var appLogSourceConverter = new ValueConverter<AppLogSource, string>(
                source => source.ToString(),
                source => ParseAppLogSource(source));

            var appLogLevelConverter = new ValueConverter<AppLogLevel, string>(
                level => level.ToString(),
                level => ParseAppLogLevel(level));

            entity.ToTable("AppLogEntries");
            entity.HasKey(log => log.Id);

            entity.Property(log => log.Source)
                .HasConversion(appLogSourceConverter)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(log => log.Level)
                .HasConversion(appLogLevelConverter)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(log => log.Category)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(log => log.EventName)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(log => log.Message)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(log => log.DetailsJson)
                .HasMaxLength(12000);

            entity.Property(log => log.TraceId)
                .HasMaxLength(120);

            entity.Property(log => log.Path)
                .HasMaxLength(500);

            entity.Property(log => log.Method)
                .HasMaxLength(20);

            entity.Property(log => log.UserAgent)
                .HasMaxLength(512);

            entity.Property(log => log.RelatedEntityType)
                .HasMaxLength(80);

            entity.Property(log => log.RelatedEntityId)
                .HasMaxLength(80);

            entity.HasIndex(log => log.CreatedAtUtc);
            entity.HasIndex(log => log.Source);
            entity.HasIndex(log => log.Level);
        });

        var propertyAttachmentKindConverter = new ValueConverter<PropertyAttachmentKind, string>(
            kind => kind.ToString(),
            kind => ParsePropertyAttachmentKind(kind));

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

            entity.Property(property => property.Strengths)
                .HasMaxLength(4000);

            entity.Property(property => property.Weaknesses)
                .HasMaxLength(4000);

            entity.Property(property => property.Opportunities)
                .HasMaxLength(4000);

            entity.Property(property => property.Threats)
                .HasMaxLength(4000);

            entity.Property(property => property.Score)
                .HasPrecision(4, 2);

            entity.Property(property => property.CondoFee)
                .HasPrecision(10, 2);

            entity.Property(property => property.Iptu)
                .HasPrecision(10, 2);

            entity.Property(property => property.Insurance)
                .HasPrecision(10, 2);

            entity.Property(property => property.ServiceFee)
                .HasPrecision(10, 2);

            entity.Property(property => property.UpfrontCost)
                .HasPrecision(10, 2);

            entity.Property(property => property.Notes)
                .HasMaxLength(8000);

            entity.Property(property => property.DiscardReason)
                .HasMaxLength(1000);

            entity.Property(property => property.OriginalUrl)
                .HasMaxLength(500);

            entity.Property(property => property.SwotStatus)
                .HasConversion(propertySwotStatusConverter)
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(property => property.IsFavorite)
                .HasDefaultValue(false);

            entity.Property(property => property.Excluded)
                .HasDefaultValue(false);

            entity.HasMany(property => property.Attachments)
                .WithOne(attachment => attachment.PropertyListing)
                .HasForeignKey(attachment => attachment.PropertyListingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(property => property.StatusHistory)
                .WithOne(history => history.PropertyListing)
                .HasForeignKey(history => history.PropertyListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AppSettingsProfile>(entity =>
        {
            var appLogLevelConverter = new ValueConverter<AppLogLevel, string>(
                level => level.ToString(),
                level => ParseAppLogLevel(level));

            entity.ToTable("AppSettingsProfiles");
            entity.HasKey(settings => settings.Id);

            entity.Property(settings => settings.DefaultCategory)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(settings => settings.DefaultCity)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(settings => settings.DefaultState)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(settings => settings.PreferredNeighborhoods)
                .HasMaxLength(2000);

            entity.Property(settings => settings.AvoidedNeighborhoods)
                .HasMaxLength(2000);

            entity.Property(settings => settings.RequireSwotStatuses)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(settings => settings.RequireNotesStatuses)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(settings => settings.RequireMediaStatuses)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(settings => settings.FavoritesSortBy)
                .HasMaxLength(40)
                .IsRequired();

            entity.Property(settings => settings.DefaultSource)
                .HasConversion(
                    source => source.ToString(),
                    source => ParsePropertySource(source))
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(settings => settings.MonthlyBudgetIdeal)
                .HasPrecision(10, 2);

            entity.Property(settings => settings.MonthlyBudgetMax)
                .HasPrecision(10, 2);

            entity.Property(settings => settings.MapInitialLatitude)
                .HasPrecision(10, 6);

            entity.Property(settings => settings.MapInitialLongitude)
                .HasPrecision(10, 6);

            entity.Property(settings => settings.PriceBelowAverageRatio)
                .HasPrecision(5, 2);

            entity.Property(settings => settings.PriceAboveAverageRatio)
                .HasPrecision(5, 2);

            entity.Property(settings => settings.BackendMinimumLogLevel)
                .HasConversion(appLogLevelConverter)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(settings => settings.FrontendMinimumLogLevel)
                .HasConversion(appLogLevelConverter)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(settings => settings.ExtensionMinimumLogLevel)
                .HasConversion(appLogLevelConverter)
                .HasMaxLength(20)
                .IsRequired();
        });

        modelBuilder.Entity<DismissedPropertyInconsistency>(entity =>
        {
            entity.ToTable("DismissedPropertyInconsistencies");
            entity.HasKey(item => item.Id);

            entity.Property(item => item.Id)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(item => item.Type)
                .HasMaxLength(120)
                .IsRequired();
        });

        modelBuilder.Entity<PropertyAttachment>(entity =>
        {
            entity.ToTable("PropertyAttachments");
            entity.HasKey(attachment => attachment.Id);

            entity.Property(attachment => attachment.Kind)
                .HasConversion(propertyAttachmentKindConverter)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(attachment => attachment.OriginalFileName)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(attachment => attachment.StoredFileName)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(attachment => attachment.RelativePath)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(attachment => attachment.ContentType)
                .HasMaxLength(120)
                .IsRequired();
        });

        modelBuilder.Entity<PropertyStatusHistory>(entity =>
        {
            var propertySwotStatusConverter = new ValueConverter<PropertySwotStatus, string>(
                status => status.ToString(),
                status => ParsePropertySwotStatus(status));

            var nullablePropertySwotStatusConverter = new ValueConverter<PropertySwotStatus?, string?>(
                status => status.HasValue ? status.Value.ToString() : null,
                status => string.IsNullOrWhiteSpace(status) ? null : ParsePropertySwotStatus(status));

            entity.ToTable("PropertyStatusHistory");
            entity.HasKey(history => history.Id);

            entity.Property(history => history.PreviousStatus)
                .HasConversion(nullablePropertySwotStatusConverter)
                .HasMaxLength(60);

            entity.Property(history => history.NewStatus)
                .HasConversion(propertySwotStatusConverter)
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(history => history.Reason)
                .HasMaxLength(1000);
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

    private static AppLogSource ParseAppLogSource(string? source)
    {
        return Enum.TryParse<AppLogSource>(source, true, out var parsedSource)
            ? parsedSource
            : AppLogSource.Backend;
    }

    private static AppLogLevel ParseAppLogLevel(string? level)
    {
        return Enum.TryParse<AppLogLevel>(level, true, out var parsedLevel)
            ? parsedLevel
            : AppLogLevel.Info;
    }

    private static PropertySwotStatus ParsePropertySwotStatus(string? status)
    {
        return status switch
        {
            "Novo" => PropertySwotStatus.Novo,
            "Analisado" => PropertySwotStatus.EmAnalise,
            "Em analise" => PropertySwotStatus.EmAnalise,
            "EmAnalise" => PropertySwotStatus.EmAnalise,
            "Visitado" => PropertySwotStatus.Visitado,
            "Proposta" => PropertySwotStatus.Proposta,
            "Favorito" => PropertySwotStatus.EmAnalise,
            "Pendente" => PropertySwotStatus.Novo,
            "Descartado" => PropertySwotStatus.Descartado,
            _ when Enum.TryParse<PropertySwotStatus>(status, true, out var parsedStatus) => parsedStatus,
            _ => PropertySwotStatus.Novo
        };
    }

    private static PropertyAttachmentKind ParsePropertyAttachmentKind(string? kind)
    {
        return kind switch
        {
            "Foto" => PropertyAttachmentKind.Foto,
            "Print" => PropertyAttachmentKind.Print,
            _ when Enum.TryParse<PropertyAttachmentKind>(kind, true, out var parsedKind) => parsedKind,
            _ => PropertyAttachmentKind.Foto
        };
    }
}
