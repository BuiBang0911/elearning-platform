using Infrastructure.Entities;
using System.ComponentModel.DataAnnotations;

namespace ApplicationCore.DTO
{
    public class InstructorApplyRequest
    {
        [Required]
        public string Specialty { get; set; }
        
        [Required]
        public string Experience { get; set; }
        
        [Required]
        public string PortfolioUrl { get; set; }
    }

    public class InstructorRequestResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserEmail { get; set; }
        public string UserFullName { get; set; }
        public string Specialty { get; set; }
        public string Experience { get; set; }
        public string PortfolioUrl { get; set; }
        public string Status { get; set; }
        public string? AdminNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    public class ProcessRequestDto
    {
        [Required]
        public RequestStatus Status { get; set; }
        public string? AdminNote { get; set; }
    }
}
