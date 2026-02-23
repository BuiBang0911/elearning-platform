using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateChatbotEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""ChatMessages""
                ALTER COLUMN ""Role"" TYPE integer
                USING CASE
                    WHEN ""Role"" = 'User' THEN 1
                    WHEN ""Role"" = 'AiAssistant' THEN 2
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""ChatMessages""
                ALTER COLUMN ""Role"" TYPE text
                USING CASE
                    WHEN ""Role"" = 'User' THEN 1
                    WHEN ""Role"" = 'AiAssistant' THEN 2
                END;
            ");
        }
    }
}
