using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateChatSesson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatSessions_Courses_CourseId",
                table: "ChatSessions");

            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "ChatSessions",
                newName: "LessonId");

            migrationBuilder.RenameIndex(
                name: "IX_ChatSessions_CourseId",
                table: "ChatSessions",
                newName: "IX_ChatSessions_LessonId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatSessions_Lessons_LessonId",
                table: "ChatSessions",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatSessions_Lessons_LessonId",
                table: "ChatSessions");

            migrationBuilder.RenameColumn(
                name: "LessonId",
                table: "ChatSessions",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_ChatSessions_LessonId",
                table: "ChatSessions",
                newName: "IX_ChatSessions_CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatSessions_Courses_CourseId",
                table: "ChatSessions",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id");
        }
    }
}
