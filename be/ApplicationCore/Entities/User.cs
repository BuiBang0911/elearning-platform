using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; } // student | lecturer | admin
        public string RefreshToken { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relationships
        public virtual ICollection<Course> TeachesCourses { get; set; }
        public virtual ICollection<Enrollment> Enrollments { get; set; }
    }
}
