using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public UserRole Role { get; set; } // student | lecturer | admin
        public string? RefreshToken { get; set; }
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RefreshTokenExpiry { get; set; }

        // Relationships
        public virtual ICollection<Course> TeachesCourses { get; set; }
        public virtual ICollection<Enrollment> Enrollments { get; set; }
    }

    public enum UserRole
    {
        Student = 1,
        Lecturer = 2,
        Admin = 3
    }
}
