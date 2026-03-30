using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Casa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAppSettingsProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppSettingsProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DefaultSource = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    DefaultCategory = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    DefaultCity = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    DefaultState = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    DefaultHasExactLocation = table.Column<bool>(type: "INTEGER", nullable: false),
                    ListingsPageSize = table.Column<int>(type: "INTEGER", nullable: false),
                    FavoritesPageSize = table.Column<int>(type: "INTEGER", nullable: false),
                    FavoritesSortBy = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    MapInitialLatitude = table.Column<decimal>(type: "TEXT", precision: 10, scale: 6, nullable: false),
                    MapInitialLongitude = table.Column<decimal>(type: "TEXT", precision: 10, scale: 6, nullable: false),
                    MapInitialZoom = table.Column<int>(type: "INTEGER", nullable: false),
                    MapOnlyExactLocation = table.Column<bool>(type: "INTEGER", nullable: false),
                    MonthlyBudgetIdeal = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    MonthlyBudgetMax = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    PreferredNeighborhoods = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    AvoidedNeighborhoods = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    PriceBelowAverageRatio = table.Column<decimal>(type: "TEXT", precision: 5, scale: 2, nullable: false),
                    PriceAboveAverageRatio = table.Column<decimal>(type: "TEXT", precision: 5, scale: 2, nullable: false),
                    RequireCoordinatesForCompleteLocation = table.Column<bool>(type: "INTEGER", nullable: false),
                    RequireOriginalUrl = table.Column<bool>(type: "INTEGER", nullable: false),
                    MinimumPhotoCount = table.Column<int>(type: "INTEGER", nullable: false),
                    RequireSwotStatuses = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    RequireNotesStatuses = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    RequireMediaStatuses = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    PriceWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    LocationWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    AnalysisWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    EvidenceWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    SourceQualityWeight = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSettingsProfiles", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppSettingsProfiles");
        }
    }
}
