using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;
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

        await dbContext.Database.MigrateAsync(cancellationToken);

        if (await dbContext.PropertyListings.AnyAsync(cancellationToken))
        {
            return;
        }

        await dbContext.PropertyListings.AddRangeAsync(GetSeedProperties(), cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static List<PropertyListing> GetSeedProperties()
    {
        var createdAtBase = DateTime.UtcNow.AddDays(-30);

        return
        [
            CreateSeedProperty("Apartamento 2 quartos", "Apartamento", "Rua Sete de Abril, 120", "Centro", "Sao Paulo", "SP", "01044-000", PropertySource.AppExterno, PropertySwotStatus.Novo, 2350, -23.55052m, -46.63331m, true, 1, createdAtBase),
            CreateSeedProperty("Casa com quintal", "Casa", "Rua Harmonia, 450", "Vila Madalena", "Sao Paulo", "SP", "05435-000", PropertySource.PortalWeb, PropertySwotStatus.EmAnalise, 3200, -23.56168m, -46.65598m, false, 2, createdAtBase),
            CreateSeedProperty("Studio compacto", "Studio", "Avenida Atlantica, 890", "Copacabana", "Rio de Janeiro", "RJ", "22010-000", PropertySource.AppExterno, PropertySwotStatus.Novo, 2800, -22.97118m, -43.18254m, true, 3, createdAtBase),
            CreateSeedProperty("Cobertura duplex", "Cobertura", "Rua Alagoas, 820", "Savassi", "Belo Horizonte", "MG", "30130-160", PropertySource.PortalWeb, PropertySwotStatus.Favorito, 5400, -19.93961m, -43.93455m, true, 4, createdAtBase),
            CreateSeedProperty("Apartamento mobiliado", "Apartamento", "Rua Chile, 150", "Centro", "Salvador", "BA", "40020-000", PropertySource.AppExterno, PropertySwotStatus.Visitado, 2600, -12.97182m, -38.50111m, true, 5, createdAtBase),
            CreateSeedProperty("Casa terrea", "Casa", "Rua Padre Chagas, 310", "Moinhos de Vento", "Porto Alegre", "RS", "90570-080", PropertySource.PortalWeb, PropertySwotStatus.Novo, 3500, -30.0277m, -51.20465m, false, 6, createdAtBase),
            CreateSeedProperty("Loft central", "Loft", "Setor Comercial Sul, Quadra 2", "Asa Sul", "Brasilia", "DF", "70302-000", PropertySource.AppExterno, PropertySwotStatus.Novo, 3100, -15.79389m, -47.88278m, true, 7, createdAtBase),
            CreateSeedProperty("Apartamento vista mar", "Apartamento", "Avenida Boa Viagem, 420", "Boa Viagem", "Recife", "PE", "51011-000", PropertySource.PortalWeb, PropertySwotStatus.Proposta, 3900, -8.12267m, -34.90064m, true, 8, createdAtBase),
            CreateSeedProperty("Kitnet reformada", "Kitnet", "Rua 24 de Maio, 91", "Centro", "Curitiba", "PR", "80230-080", PropertySource.AppExterno, PropertySwotStatus.Novo, 1650, -25.43232m, -49.27185m, false, 9, createdAtBase),
            CreateSeedProperty("Apartamento familiar", "Apartamento", "Rua dos Mundurucus, 740", "Jurunas", "Belem", "PA", "66025-660", PropertySource.PortalWeb, PropertySwotStatus.EmAnalise, 2100, -1.45583m, -48.49018m, false, 10, createdAtBase),
            CreateSeedProperty("Casa em condominio", "Casa", "Avenida Efigenio Sales, 1800", "Aleixo", "Manaus", "AM", "69060-020", PropertySource.AppExterno, PropertySwotStatus.Novo, 4300, -3.10094m, -60.01381m, true, 11, createdAtBase),
            CreateSeedProperty("Apartamento proximo ao parque", "Apartamento", "Rua das Palmeiras, 210", "Jardins", "Aracaju", "SE", "49025-550", PropertySource.PortalWeb, PropertySwotStatus.Novo, 2200, -10.94725m, -37.07308m, false, 12, createdAtBase),
            CreateSeedProperty("Studio com varanda", "Studio", "Rua Monsenhor Bruno, 650", "Meireles", "Fortaleza", "CE", "60115-190", PropertySource.AppExterno, PropertySwotStatus.Favorito, 2450, -3.73186m, -38.49678m, true, 13, createdAtBase),
            CreateSeedProperty("Apartamento amplo", "Apartamento", "Rua Candido Mendes, 500", "Centro", "Sao Luis", "MA", "65020-120", PropertySource.PortalWeb, PropertySwotStatus.Descartado, 2300, -2.52972m, -44.30278m, false, 14, createdAtBase),
            CreateSeedProperty("Casa com edicula", "Casa", "Rua Pedro II, 120", "Centro", "Joao Pessoa", "PB", "58013-420", PropertySource.AppExterno, PropertySwotStatus.Novo, 2700, -7.1195m, -34.84501m, false, 15, createdAtBase),
            CreateSeedProperty("Apartamento novo", "Apartamento", "Avenida Afonso Pena, 90", "Centro", "Campo Grande", "MS", "79002-070", PropertySource.PortalWeb, PropertySwotStatus.Novo, 2400, -20.46971m, -54.62012m, true, 16, createdAtBase),
            CreateSeedProperty("Casa geminada", "Casa", "Rua 13 de Junho, 300", "Porto", "Cuiaba", "MT", "78020-000", PropertySource.AppExterno, PropertySwotStatus.Visitado, 2600, -15.60141m, -56.09789m, false, 17, createdAtBase),
            CreateSeedProperty("Apartamento compacto", "Apartamento", "Rua Senador Souza Naves, 75", "Centro", "Londrina", "PR", "86010-160", PropertySource.PortalWeb, PropertySwotStatus.Novo, 1850, -23.30445m, -51.16958m, true, 18, createdAtBase),
            CreateSeedProperty("Cobertura com terraco", "Cobertura", "Rua Maceio, 55", "Adrianopolis", "Manaus", "AM", "69057-010", PropertySource.AppExterno, PropertySwotStatus.Favorito, 5200, -3.10395m, -60.01022m, true, 19, createdAtBase),
            CreateSeedProperty("Casa perto da praia", "Casa", "Avenida Litoranea, 130", "Ponta Negra", "Natal", "RN", "59090-130", PropertySource.PortalWeb, PropertySwotStatus.Proposta, 3400, -5.87841m, -35.17235m, false, 20, createdAtBase),
            CreateSeedProperty("Apartamento no centro historico", "Apartamento", "Rua do Giz, 40", "Centro", "Sao Luis", "MA", "65010-680", PropertySource.AppExterno, PropertySwotStatus.Novo, 2050, -2.52993m, -44.30684m, true, 21, createdAtBase),
            CreateSeedProperty("Studio perto do metro", "Studio", "Rua Aurora, 300", "Centro", "Sao Paulo", "SP", "01209-001", PropertySource.PortalWeb, PropertySwotStatus.Novo, 1950, -23.53858m, -46.64201m, true, 22, createdAtBase),
            CreateSeedProperty("Apartamento com sacada", "Apartamento", "Rua 7 de Setembro, 980", "Centro", "Florianopolis", "SC", "88010-300", PropertySource.AppExterno, PropertySwotStatus.Visitado, 3300, -27.59538m, -48.54805m, true, 23, createdAtBase),
            CreateSeedProperty("Casa de vila", "Casa", "Rua do Lavradio, 150", "Lapa", "Rio de Janeiro", "RJ", "20230-070", PropertySource.PortalWeb, PropertySwotStatus.Novo, 2900, -22.91371m, -43.18252m, false, 24, createdAtBase),
            CreateSeedProperty("Kitnet universitaria", "Kitnet", "Rua Clovis Bevilaqua, 55", "Centro", "Teresina", "PI", "64000-370", PropertySource.AppExterno, PropertySwotStatus.Descartado, 1400, -5.09194m, -42.80336m, false, 25, createdAtBase),
            CreateSeedProperty("Apartamento terreo", "Apartamento", "Rua Marechal Deodoro, 210", "Centro", "Maceio", "AL", "57020-200", PropertySource.PortalWeb, PropertySwotStatus.Novo, 1750, -9.66599m, -35.735m, true, 26, createdAtBase),
            CreateSeedProperty("Casa espacosa", "Casa", "Rua Joaquim Tavora, 610", "Centro", "Palmas", "TO", "77001-014", PropertySource.AppExterno, PropertySwotStatus.Favorito, 3600, -10.18472m, -48.33361m, false, 27, createdAtBase),
            CreateSeedProperty("Apartamento mobiliado premium", "Apartamento", "Rua das Acacias, 87", "Jardim Europa", "Goiania", "GO", "74240-160", PropertySource.PortalWeb, PropertySwotStatus.EmAnalise, 4100, -16.68689m, -49.26479m, true, 28, createdAtBase),
            CreateSeedProperty("Studio executivo", "Studio", "Rua Duque de Caxias, 180", "Centro", "Porto Velho", "RO", "76801-120", PropertySource.AppExterno, PropertySwotStatus.Novo, 1700, -8.76194m, -63.90389m, false, 29, createdAtBase),
            CreateSeedProperty("Apartamento com vista", "Apartamento", "Avenida Nacoes Unidas, 450", "Centro", "Boa Vista", "RR", "69301-000", PropertySource.PortalWeb, PropertySwotStatus.Novo, 2150, 2.82384m, -60.67529m, true, 30, createdAtBase)
        ];
    }

    private static PropertyListing CreateSeedProperty(
        string title,
        string category,
        string addressLine,
        string neighborhood,
        string city,
        string state,
        string postalCode,
        PropertySource source,
        PropertySwotStatus swotStatus,
        decimal price,
        decimal latitude,
        decimal longitude,
        bool hasExactLocation,
        int sequence,
        DateTime createdAtBase)
    {
        return new PropertyListing
        {
            Title = title,
            Category = category,
            AddressLine = addressLine,
            Neighborhood = neighborhood,
            City = city,
            State = state,
            PostalCode = postalCode,
            Source = source,
            OriginalUrl = $"https://example.com/imovel-{sequence}",
            SwotStatus = swotStatus,
            Price = price,
            Latitude = latitude,
            Longitude = longitude,
            HasExactLocation = hasExactLocation,
            Score = Math.Round(5.4m + (sequence % 5) * 0.8m, 1),
            Excluded = false,
            CreatedAtUtc = createdAtBase.AddDays(sequence - 1)
        };
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
            "Score"
        };

        return expectedColumns.Any(column => !columns.Contains(column));
    }

    private static async Task<HashSet<string>> GetPropertyListingColumnsAsync(string databasePath, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync(cancellationToken);

        var tableExistsCommand = connection.CreateCommand();
        tableExistsCommand.CommandText = """
            SELECT COUNT(*)
            FROM sqlite_master
            WHERE type = 'table' AND name = 'PropertyListings';
            """;

        var tableExists = Convert.ToInt32(await tableExistsCommand.ExecuteScalarAsync(cancellationToken)) > 0;
        if (!tableExists)
        {
            return [];
        }

        var pragmaCommand = connection.CreateCommand();
        pragmaCommand.CommandText = "PRAGMA table_info('PropertyListings');";

        await using var reader = await pragmaCommand.ExecuteReaderAsync(cancellationToken);
        var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        while (await reader.ReadAsync(cancellationToken))
        {
            columns.Add(reader.GetString(1));
        }

        return columns;
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
