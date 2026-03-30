using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Casa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDismissedPropertyInconsistencies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DismissedPropertyInconsistencies",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    PropertyId = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    DismissedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DismissedPropertyInconsistencies", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DismissedPropertyInconsistencies");
        }
    }
}
