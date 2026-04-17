using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class InstructorRequest : BaseEntity
    {
        public int UserId { get; set; }
        public virtual User User { get; set; }
        
        public string Specialty { get; set; }
        public string Experience { get; set; }
        public string PortfolioUrl { get; set; }
        
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public string? AdminNote { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
    }

    public enum RequestStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
}
