using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ApplicationCore.DTO
{
    public class LessonRequest : PagingRequest
    {
        [Required]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Lesson title is required")]
        [StringLength(255, MinimumLength = 5, ErrorMessage = "Title must be between 5 and 255 characters")]
        public string Title { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Lesson order must be at least 1")]
        public int LessonOrder { get; set; }

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        public string? Content { get; set; }
        public IFormFile? VideoFile { get; set; }
    }

    public class LessonResponse : BaseDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
        public string? VideoUrl { get; set; }
    }

    public class LessonUpdateRequest
    {
        [Required]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Lesson title is required")]
        [StringLength(255, MinimumLength = 5, ErrorMessage = "Title must be between 5 and 255 characters")]
        public string Title { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Lesson order must be at least 1")]
        public int LessonOrder { get; set; }

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        public string? Content { get; set; }
        public IFormFile? VideoFile { get; set; }
    }

    public class LessonByStudent : LessonResponse
    {
        public string? VideoUrl { get; set; }
        public bool isCompleted { get; set; }
        public List<DocumentResponse> Documents { get; set; } = new List<DocumentResponse>();
    }
}
