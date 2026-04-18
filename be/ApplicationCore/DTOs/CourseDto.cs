using Infrastructure.Entities;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ApplicationCore.DTO
{
    public class CourseRequest : PagingRequest, IValidatableObject
    {
        [Required(ErrorMessage = "Course title is required")]
        [StringLength(255, MinimumLength = 10, ErrorMessage = "Title must be between 10 and 255 characters")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Description is required")]
        [StringLength(5000, MinimumLength = 50, ErrorMessage = "Description must be between 50 and 5000 characters")]
        public string Description { get; set; }

        public int? LecturerId { get; set; }

        [Required]
        public CourseLevel Level { get; set; }

        public double Rating { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Range(0, 100000000, ErrorMessage = "Price must be at least 0 VND")]
        public decimal Price { get; set; } = 0;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Price > 0 && Price < 2000)
            {
                yield return new ValidationResult("Price must be 0 (Free) or at least 2,000 VND.", new[] { nameof(Price) });
            }
        }
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

    public class CourseUpdateRequest : IValidatableObject
    {
        [Required(ErrorMessage = "Course title is required")]
        [StringLength(255, MinimumLength = 10, ErrorMessage = "Title must be between 10 and 255 characters")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Description is required")]
        [StringLength(5000, MinimumLength = 50, ErrorMessage = "Description must be between 50 and 5000 characters")]
        public string Description { get; set; }

        public int? LecturerId { get; set; }
        public IFormFile? Thumbnail { get; set; }

        [Required]
        public CourseLevel Level { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Range(0, 100000000, ErrorMessage = "Price must be at least 0 VND")]
        public decimal Price { get; set; } = 0;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Price > 0 && Price < 2000)
            {
                yield return new ValidationResult("Price must be 0 (Free) or at least 2,000 VND.", new[] { nameof(Price) });
            }
        }
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
