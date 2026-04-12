using System;
using System.Collections.Generic;

namespace ApplicationCore.DTOs
{
    public class AdminDashboardStatsDto
    {
        public int TotalStudents { get; set; }
        public int TotalInstructors { get; set; }
        public int TotalCourses { get; set; }
        public int TotalEnrollments { get; set; }
        
        public double StudentGrowth { get; set; }
        public double InstructorGrowth { get; set; }
        public double CourseGrowth { get; set; }
        public double EnrollmentGrowth { get; set; }

        public AiUsageDto AiUsage { get; set; }

        public List<MonthlyEnrollmentDto> EnrollmentTrends { get; set; }
        public List<CategoryDistributionDto> CategoryDistribution { get; set; }
    }

    public class MonthlyEnrollmentDto
    {
        public string Month { get; set; }
        public int Count { get; set; }
    }

    public class CategoryDistributionDto
    {
        public string CategoryName { get; set; }
        public int CourseCount { get; set; }
    }

    public class AdminUserListDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
        public bool IsDelete { get; set; }
        public DateTime CreatedAt { get; set; }
        public int EnrollmentCount { get; set; }
    }

    public class AdminCourseListDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string InstructorName { get; set; }
        public string CategoryName { get; set; }
        public int StudentCount { get; set; }
        public double Rating { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
