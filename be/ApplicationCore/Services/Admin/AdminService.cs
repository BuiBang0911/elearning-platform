using ApplicationCore.DTOs;
using ApplicationCore.Services.Dashboard;
using Infrastructure.Data;
using Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Admin
{
    public class AdminService : IAdminService
    {
        private readonly DatabaseContext _context;
        private readonly IDashboardService _dashboardService;

        public AdminService(DatabaseContext context, IDashboardService dashboardService)
        {
            _context = context;
            _dashboardService = dashboardService;
        }

        public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
        {
            var now = DateTime.UtcNow;
            var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var lastMonthStart = currentMonthStart.AddMonths(-1);

            var totalStudents = await _context.Users.CountAsync(u => u.Role == UserRole.Student);
            var totalInstructors = await _context.Users.CountAsync(u => u.Role == UserRole.Instructor);
            var totalCourses = await _context.Courses.CountAsync();
            var totalEnrollments = await _context.Enrollments.CountAsync();

            // Growth calculation (Current month vs Last month)
            var currentMonthStudents = await _context.Users.CountAsync(u => u.Role == UserRole.Student && u.CreatedAt >= currentMonthStart);
            var lastMonthStudents = await _context.Users.CountAsync(u => u.Role == UserRole.Student && u.CreatedAt >= lastMonthStart && u.CreatedAt < currentMonthStart);
            
            var currentMonthInstructors = await _context.Users.CountAsync(u => u.Role == UserRole.Instructor && u.CreatedAt >= currentMonthStart);
            var lastMonthInstructors = await _context.Users.CountAsync(u => u.Role == UserRole.Instructor && u.CreatedAt >= lastMonthStart && u.CreatedAt < currentMonthStart);

            var currentMonthCourses = await _context.Courses.CountAsync(c => c.CreatedAt >= currentMonthStart);
            var lastMonthCourses = await _context.Courses.CountAsync(c => c.CreatedAt >= lastMonthStart && c.CreatedAt < currentMonthStart);

            var currentMonthEnrollments = await _context.Enrollments.CountAsync(e => e.JoinedAt >= currentMonthStart);
            var lastMonthEnrollments = await _context.Enrollments.CountAsync(e => e.JoinedAt >= lastMonthStart && e.JoinedAt < currentMonthStart);

            Func<int, int, double> calculateGrowth = (current, last) => 
                last == 0 ? (current > 0 ? 100 : 0) : Math.Round(((double)(current) / last) * 100, 1);

            // Trends for last 6 months
            var sixMonthsAgo = now.AddMonths(-5);
            var enrollmentsTrend = await _context.Enrollments
                .Where(e => e.JoinedAt >= new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc))
                .GroupBy(e => new { e.JoinedAt.Year, e.JoinedAt.Month })
                .Select(g => new MonthlyEnrollmentDto
                {
                    Month = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(g.Key.Month) + " " + g.Key.Year,
                    Count = g.Count()
                })
                .ToListAsync();

            // Category Distribution
            var categoryDist = await _context.Categories
                .Select(c => new CategoryDistributionDto
                {
                    CategoryName = c.Name,
                    CourseCount = c.Courses.Count()
                })
                .ToListAsync();

            return new AdminDashboardStatsDto
                {
                    TotalStudents = totalStudents,
                    TotalInstructors = totalInstructors,
                    TotalCourses = totalCourses,
                    TotalEnrollments = totalEnrollments,
                    StudentGrowth = calculateGrowth(currentMonthStudents, lastMonthStudents),
                    InstructorGrowth = calculateGrowth(currentMonthInstructors, lastMonthInstructors),
                    CourseGrowth = calculateGrowth(currentMonthCourses, lastMonthCourses),
                    EnrollmentGrowth = calculateGrowth(currentMonthEnrollments, lastMonthEnrollments),
                    AiUsage = await _dashboardService.GetAiUsageAsync(),
                    EnrollmentTrends = enrollmentsTrend,
                    CategoryDistribution = categoryDist
                };
        }

        public async Task<List<AdminUserListDto>> GetUsersAsync()
        {
            return await _context.Users
                .Select(u => new AdminUserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    Role = u.Role.ToString(),
                    IsDelete = u.IsDelete,
                    CreatedAt = u.CreatedAt,
                    EnrollmentCount = u.Enrollments.Count()
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ToggleUserStatusAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsDelete = !user.IsDelete;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AdminCourseListDto>> GetCoursesAsync()
        {
            return await _context.Courses
                .Select(c => new AdminCourseListDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    InstructorName = c.Lecturer.FullName,
                    CategoryName = c.Category.Name,
                    StudentCount = c.Enrollments.Count(),
                    Rating = c.Rating,
                    CreatedAt = c.CreatedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> DeleteCourseAsync(int courseId)
        {
            var course = await _context.Courses
                .Include(c => c.Lessons)
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null) return false;

            // Permanent delete as requested
            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
