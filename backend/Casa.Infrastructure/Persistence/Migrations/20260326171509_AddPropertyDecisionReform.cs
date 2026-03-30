using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Casa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyDecisionReform : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CondoFee",
                table: "PropertyListings",
                type: "TEXT",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiscardReason",
                table: "PropertyListings",
                type: "TEXT",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Insurance",
                table: "PropertyListings",
                type: "TEXT",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Iptu",
                table: "PropertyListings",
                type: "TEXT",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "UpfrontCost",
                table: "PropertyListings",
                type: "TEXT",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PropertyStatusHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PropertyListingId = table.Column<int>(type: "INTEGER", nullable: false),
                    PreviousStatus = table.Column<string>(type: "TEXT", maxLength: 60, nullable: true),
                    NewStatus = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    ChangedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyStatusHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyStatusHistory_PropertyListings_PropertyListingId",
                        column: x => x.PropertyListingId,
                        principalTable: "PropertyListings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PropertyStatusHistory_PropertyListingId",
                table: "PropertyStatusHistory",
                column: "PropertyListingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropertyStatusHistory");

            migrationBuilder.DropColumn(
                name: "CondoFee",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "DiscardReason",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Insurance",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Iptu",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "UpfrontCost",
                table: "PropertyListings");
        }
    }
}
