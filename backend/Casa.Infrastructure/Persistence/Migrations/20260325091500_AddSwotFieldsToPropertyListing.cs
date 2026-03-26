using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Casa.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(CasaDbContext))]
    [Migration("20260325091500_AddSwotFieldsToPropertyListing")]
    public partial class AddSwotFieldsToPropertyListing : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Opportunities",
                table: "PropertyListings",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Strengths",
                table: "PropertyListings",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Threats",
                table: "PropertyListings",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Weaknesses",
                table: "PropertyListings",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Opportunities",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Strengths",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Threats",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Weaknesses",
                table: "PropertyListings");
        }
    }
}
