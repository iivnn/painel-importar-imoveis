using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Casa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIsFavoriteToPropertyListing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFavorite",
                table: "PropertyListings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE PropertyListings
                SET IsFavorite = 1,
                    SwotStatus = 'EmAnalise'
                WHERE SwotStatus = 'Favorito';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE PropertyListings
                SET SwotStatus = 'Favorito'
                WHERE IsFavorite = 1;
                """);

            migrationBuilder.DropColumn(
                name: "IsFavorite",
                table: "PropertyListings");
        }
    }
}
