using System;
using System.Collections.Generic;

namespace ApplicationCore.DTOs
{
    public class CourseDetailStatsDto
    {
        public int TotalStudents { get; set; }
        public double AverageRating { get; set; }
        public int AiQuestionsCount { get; set; }
        public List<MonthlyEnrollmentDto> EnrollmentTrend { get; set; }
        public List<RecentReviewDto> RecentReviews { get; set; }
    }
}
