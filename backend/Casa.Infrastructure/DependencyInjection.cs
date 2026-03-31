using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Infrastructure.Persistence;
using Casa.Infrastructure.Persistence.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Casa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CasaDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("CasaDb")));

        services.AddScoped<IPropertyListingRepository, PropertyListingRepository>();
        services.AddScoped<IAppSettingsRepository, AppSettingsRepository>();
        services.AddScoped<IDismissedPropertyInconsistencyRepository, DismissedPropertyInconsistencyRepository>();

        return services;
    }

    public static async Task InitialiseInfrastructureAsync(this IServiceProvider services, string contentRootPath, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CasaDbContext>();

        var databasePath = GetDatabasePath(dbContext, contentRootPath);
        Directory.CreateDirectory(Path.GetDirectoryName(databasePath)!);

        if (File.Exists(databasePath) && await IsLegacySchemaAsync(databasePath, cancellationToken))
        {
            var initialMigration = dbContext.Database.GetMigrations().FirstOrDefault();
            await UpgradeLegacySchemaAsync(databasePath, initialMigration, cancellationToken);
        }

        var excludedMigration = dbContext.Database
            .GetMigrations()
            .LastOrDefault(migration => migration.Contains("AddExcludedToPropertyListing", StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(excludedMigration))
        {
            await MarkMigrationAsAppliedIfColumnExistsAsync(
                databasePath,
                excludedMigration,
                "Excluded",
                cancellationToken);
        }

        var swotMigration = dbContext.Database
            .GetMigrations()
            .LastOrDefault(migration => migration.Contains("AddSwotFieldsToPropertyListing", StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(swotMigration))
        {
            await MarkMigrationAsAppliedIfColumnExistsAsync(
                databasePath,
                swotMigration,
                "Strengths",
                cancellationToken);
        }

        var scoreMigration = dbContext.Database
            .GetMigrations()
            .LastOrDefault(migration => migration.Contains("AddScoreToPropertyListing", StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(scoreMigration))
        {
            await MarkMigrationAsAppliedIfColumnExistsAsync(
                databasePath,
                scoreMigration,
                "Score",
                cancellationToken);
        }

        var favoriteMigration = dbContext.Database
            .GetMigrations()
            .LastOrDefault(migration => migration.Contains("AddIsFavoriteToPropertyListing", StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(favoriteMigration))
        {
            await MarkMigrationAsAppliedIfColumnExistsAsync(
                databasePath,
                favoriteMigration,
                "IsFavorite",
                cancellationToken);
        }

        var serviceFeeMigration = dbContext.Database
            .GetMigrations()
            .LastOrDefault(migration => migration.Contains("AddServiceFeeToPropertyListing", StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(serviceFeeMigration))
        {
            await MarkMigrationAsAppliedIfColumnExistsAsync(
                databasePath,
                serviceFeeMigration,
                "ServiceFee",
                cancellationToken);
        }

        await dbContext.Database.MigrateAsync(cancellationToken);
        await EnsureAppLogsTableAsync(databasePath, cancellationToken);
        await EnsureAppSettingsProfileSchemaAsync(databasePath, cancellationToken);

        if (!await dbContext.AppSettingsProfiles.AnyAsync(cancellationToken))
        {
            await dbContext.AppSettingsProfiles.AddAsync(new AppSettingsProfile(), cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await CleanupAppLogsAsync(dbContext, cancellationToken);

    }

    private static async Task EnsureAppLogsTableAsync(string databasePath, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync(cancellationToken);

        var createTableCommand = connection.CreateCommand();
        createTableCommand.CommandText = """
            CREATE TABLE IF NOT EXISTS "AppLogEntries" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_AppLogEntries" PRIMARY KEY AUTOINCREMENT,
                "Source" TEXT NOT NULL,
                "Level" TEXT NOT NULL,
                "Category" TEXT NOT NULL,
                "EventName" TEXT NOT NULL,
                "Message" TEXT NOT NULL,
                "DetailsJson" TEXT NOT NULL DEFAULT '',
                "TraceId" TEXT NOT NULL DEFAULT '',
                "Path" TEXT NOT NULL DEFAULT '',
                "Method" TEXT NOT NULL DEFAULT '',
                "UserAgent" TEXT NOT NULL DEFAULT '',
                "RelatedEntityType" TEXT NOT NULL DEFAULT '',
                "RelatedEntityId" TEXT NOT NULL DEFAULT '',
                "CreatedAtUtc" TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_AppLogEntries_CreatedAtUtc" ON "AppLogEntries" ("CreatedAtUtc");
            CREATE INDEX IF NOT EXISTS "IX_AppLogEntries_Source" ON "AppLogEntries" ("Source");
            CREATE INDEX IF NOT EXISTS "IX_AppLogEntries_Level" ON "AppLogEntries" ("Level");
            """;

        await createTableCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task EnsureAppSettingsProfileSchemaAsync(string databasePath, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync(cancellationToken);

        var createTableCommand = connection.CreateCommand();
        createTableCommand.CommandText = """
            CREATE TABLE IF NOT EXISTS "AppSettingsProfiles" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_AppSettingsProfiles" PRIMARY KEY,
                "DefaultSource" TEXT NOT NULL DEFAULT 'AppExterno',
                "DefaultCategory" TEXT NOT NULL DEFAULT 'Apartamento',
                "DefaultCity" TEXT NOT NULL DEFAULT 'Sao Paulo',
                "DefaultState" TEXT NOT NULL DEFAULT 'SP',
                "DefaultHasExactLocation" INTEGER NOT NULL DEFAULT 1,
                "ListingsPageSize" INTEGER NOT NULL DEFAULT 10,
                "FavoritesPageSize" INTEGER NOT NULL DEFAULT 6,
                "FavoritesSortBy" TEXT NOT NULL DEFAULT 'Recent',
                "MapInitialLatitude" TEXT NOT NULL DEFAULT '-14.235',
                "MapInitialLongitude" TEXT NOT NULL DEFAULT '-51.9253',
                "MapInitialZoom" INTEGER NOT NULL DEFAULT 4,
                "MapOnlyExactLocation" INTEGER NOT NULL DEFAULT 0,
                "MonthlyBudgetIdeal" TEXT NOT NULL DEFAULT '2500',
                "MonthlyBudgetMax" TEXT NOT NULL DEFAULT '3500',
                "PreferredNeighborhoods" TEXT NOT NULL DEFAULT '',
                "AvoidedNeighborhoods" TEXT NOT NULL DEFAULT '',
                "PriceBelowAverageRatio" TEXT NOT NULL DEFAULT '0.72',
                "PriceAboveAverageRatio" TEXT NOT NULL DEFAULT '1.35',
                "RequireCoordinatesForCompleteLocation" INTEGER NOT NULL DEFAULT 1,
                "RequireOriginalUrl" INTEGER NOT NULL DEFAULT 1,
                "MinimumPhotoCount" INTEGER NOT NULL DEFAULT 1,
                "RequireSwotStatuses" TEXT NOT NULL DEFAULT 'EmAnalise,Visitado,Proposta',
                "RequireNotesStatuses" TEXT NOT NULL DEFAULT 'Visitado,Proposta',
                "RequireMediaStatuses" TEXT NOT NULL DEFAULT 'Visitado,Proposta',
                "PriceWeight" INTEGER NOT NULL DEFAULT 30,
                "LocationWeight" INTEGER NOT NULL DEFAULT 25,
                "AnalysisWeight" INTEGER NOT NULL DEFAULT 20,
                "EvidenceWeight" INTEGER NOT NULL DEFAULT 15,
                "SourceQualityWeight" INTEGER NOT NULL DEFAULT 10
            );
            """;

        await createTableCommand.ExecuteNonQueryAsync(cancellationToken);

        var columns = await GetTableColumnsAsync(connection, "AppSettingsProfiles", cancellationToken);
        var alterStatements = new List<string>();

        AddMissingColumn(columns, alterStatements, "BackendMinimumLogLevel", "TEXT NOT NULL DEFAULT 'Info'");
        AddMissingColumn(columns, alterStatements, "FrontendMinimumLogLevel", "TEXT NOT NULL DEFAULT 'Warning'");
        AddMissingColumn(columns, alterStatements, "ExtensionMinimumLogLevel", "TEXT NOT NULL DEFAULT 'Warning'");
        AddMissingColumn(columns, alterStatements, "InfoLogRetentionDays", "INTEGER NOT NULL DEFAULT 30");
        AddMissingColumn(columns, alterStatements, "WarningLogRetentionDays", "INTEGER NOT NULL DEFAULT 45");
        AddMissingColumn(columns, alterStatements, "ErrorLogRetentionDays", "INTEGER NOT NULL DEFAULT 90");
        AddMissingColumn(columns, alterStatements, "LogNavigationEvents", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "LogFrontendHttpFailures", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "LogRealtimeEvents", "INTEGER NOT NULL DEFAULT 0");
        AddMissingColumn(columns, alterStatements, "LogExtensionExtractionEvents", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "LogExtensionGeocodingEvents", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "LogExtensionImageImportEvents", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "AllowFrontendLogIngestion", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "AllowExtensionLogIngestion", "INTEGER NOT NULL DEFAULT 1");
        AddMissingColumn(columns, alterStatements, "LogDetailsMaxLength", "INTEGER NOT NULL DEFAULT 4000");
        AddMissingColumn(columns, alterStatements, "LogAutoCleanupEnabled", "INTEGER NOT NULL DEFAULT 1");

        foreach (var statement in alterStatements)
        {
            var command = connection.CreateCommand();
            command.CommandText = statement;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private static async Task CleanupAppLogsAsync(CasaDbContext dbContext, CancellationToken cancellationToken)
    {
        var settings = await dbContext.AppSettingsProfiles
            .AsNoTracking()
            .FirstAsync(profile => profile.Id == AppSettingsProfile.SingletonId, cancellationToken);

        if (!settings.LogAutoCleanupEnabled)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var infoThreshold = now.AddDays(-Math.Max(1, settings.InfoLogRetentionDays));
        var warningThreshold = now.AddDays(-Math.Max(1, settings.WarningLogRetentionDays));
        var errorThreshold = now.AddDays(-Math.Max(1, settings.ErrorLogRetentionDays));

        await dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"""DELETE FROM "AppLogEntries" WHERE "Level" = 'Info' AND "CreatedAtUtc" < {infoThreshold};""",
            cancellationToken);

        await dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"""DELETE FROM "AppLogEntries" WHERE "Level" = 'Warning' AND "CreatedAtUtc" < {warningThreshold};""",
            cancellationToken);

        await dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"""DELETE FROM "AppLogEntries" WHERE "Level" = 'Error' AND "CreatedAtUtc" < {errorThreshold};""",
            cancellationToken);
    }

    private static string GetDatabasePath(CasaDbContext dbContext, string contentRootPath)
    {
        var connectionString = dbContext.Database.GetConnectionString()
            ?? throw new InvalidOperationException("CasaDb connection string was not configured.");

        var builder = new SqliteConnectionStringBuilder(connectionString);
        var dataSource = builder.DataSource;

        if (string.IsNullOrWhiteSpace(dataSource))
        {
            throw new InvalidOperationException("CasaDb connection string must define a Data Source.");
        }

        return Path.IsPathRooted(dataSource)
            ? dataSource
            : Path.GetFullPath(Path.Combine(contentRootPath, dataSource));
    }

    private static async Task<bool> IsLegacySchemaAsync(string databasePath, CancellationToken cancellationToken)
    {
        var columns = await GetPropertyListingColumnsAsync(databasePath, cancellationToken);
        if (columns.Count == 0)
        {
            return false;
        }

        var expectedColumns = new[]
        {
            "AddressLine",
            "City",
            "State",
            "PostalCode",
            "HasExactLocation",
            "Excluded",
            "Strengths",
            "Weaknesses",
            "Opportunities",
            "Threats",
            "Score",
            "IsFavorite",
            "ServiceFee"
        };

        return expectedColumns.Any(column => !columns.Contains(column));
    }

    private static async Task<HashSet<string>> GetPropertyListingColumnsAsync(string databasePath, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync(cancellationToken);
        return await GetTableColumnsAsync(connection, "PropertyListings", cancellationToken);
    }

    private static async Task<HashSet<string>> GetTableColumnsAsync(
        SqliteConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        var tableExistsCommand = connection.CreateCommand();
        tableExistsCommand.CommandText = """
            SELECT COUNT(*)
            FROM sqlite_master
            WHERE type = 'table' AND name = $tableName;
            """;
        tableExistsCommand.Parameters.AddWithValue("$tableName", tableName);

        var tableExists = Convert.ToInt32(await tableExistsCommand.ExecuteScalarAsync(cancellationToken)) > 0;
        if (!tableExists)
        {
            return [];
        }

        var pragmaCommand = connection.CreateCommand();
        pragmaCommand.CommandText = $"PRAGMA table_info('{tableName}');";

        await using var reader = await pragmaCommand.ExecuteReaderAsync(cancellationToken);
        var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        while (await reader.ReadAsync(cancellationToken))
        {
            columns.Add(reader.GetString(1));
        }

        return columns;
    }

    private static void AddMissingColumn(
        HashSet<string> columns,
        ICollection<string> alterStatements,
        string columnName,
        string sqlTypeAndDefault)
    {
        if (!columns.Contains(columnName))
        {
            alterStatements.Add($"ALTER TABLE AppSettingsProfiles ADD COLUMN {columnName} {sqlTypeAndDefault};");
        }
    }

    private static async Task UpgradeLegacySchemaAsync(
        string databasePath,
        string? initialMigration,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync(cancellationToken);

        var columns = await GetPropertyListingColumnsAsync(databasePath, cancellationToken);
        var upgradeStatements = new List<string>();

        if (!columns.Contains("AddressLine"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN AddressLine TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("City"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN City TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("State"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN State TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("PostalCode"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN PostalCode TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("HasExactLocation"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN HasExactLocation INTEGER NOT NULL DEFAULT 0;");
        }

        if (!columns.Contains("Excluded"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN Excluded INTEGER NOT NULL DEFAULT 0;");
        }

        if (!columns.Contains("Strengths"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN Strengths TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("Weaknesses"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN Weaknesses TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("Opportunities"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN Opportunities TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("Threats"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN Threats TEXT NOT NULL DEFAULT '';");
        }

        if (!columns.Contains("Score"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN Score TEXT NULL;");
        }

        if (!columns.Contains("IsFavorite"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN IsFavorite INTEGER NOT NULL DEFAULT 0;");
        }

        if (!columns.Contains("ServiceFee"))
        {
            upgradeStatements.Add("ALTER TABLE PropertyListings ADD COLUMN ServiceFee TEXT NULL;");
        }

        foreach (var statement in upgradeStatements)
        {
            var command = connection.CreateCommand();
            command.CommandText = statement;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        if (upgradeStatements.Count > 0)
        {
            var patchDefaultsCommand = connection.CreateCommand();
            patchDefaultsCommand.CommandText = """
                UPDATE PropertyListings
                SET AddressLine = CASE WHEN trim(AddressLine) = '' THEN Neighborhood ELSE AddressLine END,
                    City = CASE WHEN trim(City) = '' THEN 'Sao Paulo' ELSE City END,
                    State = CASE WHEN trim(State) = '' THEN 'SP' ELSE State END,
                    PostalCode = CASE WHEN trim(PostalCode) = '' THEN '00000-000' ELSE PostalCode END
                WHERE trim(AddressLine) = ''
                   OR trim(City) = ''
                   OR trim(State) = ''
                   OR trim(PostalCode) = '';
                """;

            await patchDefaultsCommand.ExecuteNonQueryAsync(cancellationToken);

            var patchFavoriteCommand = connection.CreateCommand();
            patchFavoriteCommand.CommandText = """
                UPDATE PropertyListings
                SET IsFavorite = 1,
                    SwotStatus = 'EmAnalise'
                WHERE SwotStatus = 'Favorito';
                """;

            await patchFavoriteCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(initialMigration))
        {
            return;
        }

        var createHistoryTableCommand = connection.CreateCommand();
        createHistoryTableCommand.CommandText = """
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                "ProductVersion" TEXT NOT NULL
            );
            """;

        await createHistoryTableCommand.ExecuteNonQueryAsync(cancellationToken);

        var insertHistoryCommand = connection.CreateCommand();
        insertHistoryCommand.CommandText = """
            INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ($migrationId, '8.0.25');
            """;
        insertHistoryCommand.Parameters.AddWithValue("$migrationId", initialMigration);

        await insertHistoryCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task MarkMigrationAsAppliedIfColumnExistsAsync(
        string databasePath,
        string migrationId,
        string columnName,
        CancellationToken cancellationToken)
    {
        var columns = await GetPropertyListingColumnsAsync(databasePath, cancellationToken);
        if (!columns.Contains(columnName))
        {
            return;
        }

        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync(cancellationToken);

        var createHistoryTableCommand = connection.CreateCommand();
        createHistoryTableCommand.CommandText = """
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                "ProductVersion" TEXT NOT NULL
            );
            """;

        await createHistoryTableCommand.ExecuteNonQueryAsync(cancellationToken);

        var insertHistoryCommand = connection.CreateCommand();
        insertHistoryCommand.CommandText = """
            INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ($migrationId, '8.0.25');
            """;
        insertHistoryCommand.Parameters.AddWithValue("$migrationId", migrationId);

        await insertHistoryCommand.ExecuteNonQueryAsync(cancellationToken);
    }
}
