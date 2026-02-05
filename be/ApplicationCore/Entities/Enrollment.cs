using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Entities
{
    public class Enrollment
    {
        // Enrollment thường là bảng trung gian (Composite Key)
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; }
        public virtual Course Course { get; set; }
    }
}
