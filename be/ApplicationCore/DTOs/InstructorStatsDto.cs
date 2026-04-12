using System;
using System.Collections.Generic;

namespace ApplicationCore.DTOs
{
    public class InstructorDashboardStatsDto
    {
        public int TotalCourses { get; set; }
        public int TotalStudents { get; set; }
        public double AverageRating { get; set; }
        public int TotalMaterials { get; set; }
        
        public AiUsageDto AiUsage { get; set; }
        public List<MonthlyEnrollmentDto> EnrollmentTrends { get; set; }
        public List<RecentReviewDto> RecentReviews { get; set; }
    }

    public class AiUsageDto
    {
        public int TotalQuestions { get; set; }
        public double AvgResponseTimeSeconds { get; set; }
    }

    public class RecentReviewDto
    {
        public string StudentName { get; set; }
        public string CourseTitle { get; set; }
        public double Rating { get; set; }
        public DateTime Date { get; set; }
    }
}
