using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEnumForRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
        ALTER TABLE "Users"
        ALTER COLUMN "Role" TYPE integer
        USING ("Role"::integer);
    """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
        ALTER TABLE "Users"
        ALTER COLUMN "Role" TYPE text
        USING ("Role"::text);
    """);
        }
    }
}
