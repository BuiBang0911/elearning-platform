using Infrastructure.Entities;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ApplicationCore.DTO
{
    public class DocumentRequest : PagingRequest
    {
        [Required]
        public int LessonId { get; set; }

        [Required(ErrorMessage = "File name is required")]
        [StringLength(255, ErrorMessage = "File name cannot exceed 255 characters")]
        public string FileName { get; set; }
        
        public string? FilePath { get; set; }
    }

    public class DocumentResponse : BaseDto
    {
        public int LessonId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
        public string? LessonTitle { get; set; }
        public int? CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public double Size { get; set; }
        public FileStatus Status { get; set; }
    }

    public class DocumentUpdateRequest
    {
        [Required]
        public int LessonId { get; set; }

        [Required(ErrorMessage = "File name is required")]
        [StringLength(255, ErrorMessage = "File name cannot exceed 255 characters")]
        public string FileName { get; set; }

        public FileStatus Status { get; set; }
        public IFormFile? File { get; set; }
    }

}
