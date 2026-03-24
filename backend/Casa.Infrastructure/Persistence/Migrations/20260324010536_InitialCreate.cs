using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Casa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PropertyListings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    OriginalUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    SwotStatus = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: true),
                    AddressLine = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Neighborhood = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    City = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    State = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    PostalCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Latitude = table.Column<decimal>(type: "TEXT", nullable: true),
                    Longitude = table.Column<decimal>(type: "TEXT", nullable: true),
                    HasExactLocation = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyListings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropertyListings");
        }
    }
}
