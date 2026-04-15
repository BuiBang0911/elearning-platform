using Infrastructure.Entities;
using Microsoft.AspNetCore.Http;

namespace ApplicationCore.DTO
{
    public class CourseRequest : PagingRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; }
        public CourseLevel Level { get; set; }
        public double Rating { get; set; }
        public int CategoryId { get; set; }
        public decimal Price { get; set; } = 0;
    }

    public class CourseResponse : BaseDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; }
        public string? LectureName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Thumbnail { get; set; }
        public CourseLevel Level { get; set; }
        public double Rating { get; set; }
        public decimal Price { get; set; }
        public string? CategoryName { get; set; }
        public int? CategoryId { get; set; }
    }

    public class CourseUpdateRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; }
        public IFormFile? Thumbnail { get; set; }
        public CourseLevel Level { get; set; }
        public int CategoryId { get; set; }
        public decimal Price { get; set; } = 0;
    }

    public class CourseDashboardResponse : CourseResponse
    {
        public int Students { get; set; }
    }

    public class CourseByStudentDashboard
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime JoinAt { get; set; }
        public List<LessonByStudent> Lessons { get; set; }
    }

    public class UpdateRatingRequest
    {
        public int CourseId { get; set; }
        public int Rating { get; set; }
    }

    public class CourseForStudent
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string? InstructorName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Thumbnail { get; set; }
        public CourseLevel Level { get; set; }
        public double Rating { get; set; }
        public string? CategoryName { get; set; }
        public double Progress { get; set; }
        public bool IsEnrolled { get; set; }
    }

    public class CourseListDto : CourseResponse
    {
        public bool IsEnrolled { get; set; }
        public double Progress { get; set; }
        public int TotalStudents { get; set; }
    }

    public class CourseDetailForStudentDto : CourseResponse
    {
        public bool IsEnrolled { get; set; }
        public double Progress { get; set; }
        public int TotalStudents { get; set; }
        public List<LessonByStudent> Lessons { get; set; } = new List<LessonByStudent>();
    }
}
