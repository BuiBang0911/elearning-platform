using ApplicationCore.DTOs;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly DatabaseContext _context;

        public DashboardService(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<StudentStatsDto> GetStudentDashboardStatsAsync(int studentId)
        {
            var enrolledCount = await _context.Enrollments
                .CountAsync(e => e.UserId == studentId);

            var totalLessonsFinished = await _context.UserLessons
                .CountAsync(ul => ul.UserId == studentId && ul.IsCompleted);

            var completedCount = await _context.Enrollments
                .Where(e => e.UserId == studentId)
                .CountAsync(e => e.Course.Lessons.Any() &&
                                 e.Course.Lessons.All(l => _context.UserLessons
                                    .Any(ul => ul.LessonId == l.Id && ul.UserId == studentId && ul.IsCompleted)));

            return new StudentStatsDto
            {
                EnrolledCount = enrolledCount,
                TotalLessonsFinished = totalLessonsFinished,
                CompletedCount = completedCount
            };
        }
    }
}
