using ApplicationCore.DTOs;
using Infrastructure.Data;
using Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
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

        public async Task<InstructorDashboardStatsDto> GetInstructorDashboardStatsAsync(int instructorId)
        {
            var coursesQuery = _context.Courses.Where(c => c.LecturerId == instructorId);
            
            var totalCourses = await coursesQuery.CountAsync();
            var totalStudents = await _context.Enrollments
                .Where(e => e.Course.LecturerId == instructorId)
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync();
            
            var avgRating = await coursesQuery
                .Where(c => c.Rating > 0)
                .Select(c => (double?)c.Rating)
                .AverageAsync() ?? 0;

            var totalMaterials = await _context.Documents
                .CountAsync(d => d.Lesson.Course.LecturerId == instructorId);

            // AI Usage specific to this instructor's courses
            var aiUsage = await GetAiUsageAsync(instructorId);

            // Enrollment trend (last 6 months)
            var now = DateTime.UtcNow;
            var sixMonthsAgo = now.AddMonths(-5);
            var trend = await _context.Enrollments
                .Where(e => e.Course.LecturerId == instructorId && e.JoinedAt >= new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc))
                .GroupBy(e => new { e.JoinedAt.Year, e.JoinedAt.Month })
                .Select(g => new MonthlyEnrollmentDto
                {
                    Month = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(g.Key.Month) + " " + g.Key.Year,
                    Count = g.Count()
                })
                .ToListAsync();

            // Recent Reviews
            var recentReviews = await _context.Enrollments
                .Where(e => e.Course.LecturerId == instructorId && e.rating > 0)
                .OrderByDescending(e => e.JoinedAt)
                .Take(5)
                .Select(e => new RecentReviewDto
                {
                    StudentName = e.User.FullName,
                    CourseTitle = e.Course.Title,
                    Rating = e.rating,
                    Date = e.JoinedAt
                })
                .ToListAsync();

            // SỬA ĐỔI: Lấy danh sách khóa học tốt nhất (Top 3 theo số lượng học viên)
            var topCourses = await coursesQuery
                .OrderByDescending(c => _context.Enrollments.Count(e => e.CourseId == c.Id))
                .Take(3)
                .Select(c => new TopCourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Rating = c.Rating,
                    StudentCount = _context.Enrollments.Count(e => e.CourseId == c.Id)
                })
                .ToListAsync();

            return new InstructorDashboardStatsDto
            {
                TotalCourses = totalCourses,
                TotalStudents = totalStudents,
                AverageRating = Math.Round(avgRating, 1),
                TotalMaterials = totalMaterials,
                AiUsage = aiUsage,
                EnrollmentTrends = trend,
                RecentReviews = recentReviews,
                TopCourses = topCourses
            };
        }

        public async Task<AiUsageDto> GetAiUsageAsync(int? instructorId = null)
        {
            var messagesQuery = _context.ChatMessages.AsQueryable();
            
            if (instructorId.HasValue)
            {
                messagesQuery = messagesQuery.Where(m => m.Session.Lesson != null && m.Session.Lesson.Course.LecturerId == instructorId);
            }

            var totalQuestions = await messagesQuery.CountAsync(m => m.Role == ChatbotRole.User);
            
            // Simplified Response Time Calculation: Avg time between User message and next Assistant message in same session
            // Performance note: This can be heavy, but we'll optimize by taking a sample or limited set if needed.
            // For now, let's do a basic calculation.
            var responseTimes = await _context.ChatMessages
                .Where(m => m.Role == ChatbotRole.AiAssistant)
                .OrderByDescending(m => m.CreatedAt)
                .Take(100) // Sample last 100 for performance
                .Select(m => new { 
                    Current = m.CreatedAt, 
                    Previous = _context.ChatMessages
                        .Where(pm => pm.SessionId == m.SessionId && pm.Role == ChatbotRole.User && pm.CreatedAt < m.CreatedAt)
                        .OrderByDescending(pm => pm.CreatedAt)
                        .Select(pm => pm.CreatedAt)
                        .FirstOrDefault()
                })
                .ToListAsync();

            var avgTime = responseTimes
                .Where(x => x.Previous != default)
                .Select(x => (x.Current - x.Previous).TotalSeconds)
                .DefaultIfEmpty(0)
                .Average();

            return new AiUsageDto
            {
                TotalQuestions = totalQuestions,
                AvgResponseTimeSeconds = Math.Round(avgTime, 1)
            };
        }

        public async Task<CourseDetailStatsDto> GetCourseDetailStatsAsync(int courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return null;

            var totalStudents = await _context.Enrollments.CountAsync(e => e.CourseId == courseId);
            var aiQuestionsCount = await _context.ChatMessages
                .CountAsync(m => m.Session.Lesson != null && m.Session.Lesson.CourseId == courseId && m.Role == ChatbotRole.User);

            // Trend for this course
            var now = DateTime.UtcNow;
            var sixMonthsAgo = now.AddMonths(-5);
            var trend = await _context.Enrollments
                .Where(e => e.CourseId == courseId && e.JoinedAt >= new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc))
                .GroupBy(e => new { e.JoinedAt.Year, e.JoinedAt.Month })
                .Select(g => new MonthlyEnrollmentDto
                {
                    Month = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(g.Key.Month) + " " + g.Key.Year,
                    Count = g.Count()
                })
                .ToListAsync();

            var recentReviews = await _context.Enrollments
                .Where(e => e.CourseId == courseId && e.rating > 0)
                .OrderByDescending(e => e.JoinedAt)
                .Take(5)
                .Select(e => new RecentReviewDto
                {
                    StudentName = e.User.FullName,
                    CourseTitle = course.Title,
                    Rating = e.rating,
                    Date = e.JoinedAt
                })
                .ToListAsync();

            return new CourseDetailStatsDto
            {
                TotalStudents = totalStudents,
                AverageRating = course.Rating,
                AiQuestionsCount = aiQuestionsCount,
                EnrollmentTrend = trend,
                RecentReviews = recentReviews
            };
        }
    }
}
