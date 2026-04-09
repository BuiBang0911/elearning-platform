using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class Enrollment : BaseEntity
    {
        // Enrollment thường là bảng trung gian (Composite Key)
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public double rating { get; set; } = 0;
        public EnrollmentStatus Status { get; set; }

        public virtual User User { get; set; }
        public virtual Course Course { get; set; }
    }

    public enum EnrollmentStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
}
