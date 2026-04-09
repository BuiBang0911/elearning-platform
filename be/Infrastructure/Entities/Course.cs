using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class Course : BaseEntity
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; }
        public string? Thumbnail { get; set; }
        public CourseLevel Level { get; set; }
        public double Rating { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? CategoryId { get; set; }

        // Navigation properties
        public virtual User? Lecturer { get; set; }
        public virtual Category? Category { get; set; }
        public virtual ICollection<Enrollment> Enrollments { get; set; }
        public virtual ICollection<Lesson> Lessons { get; set; }
    }

    public enum CourseLevel
    {
        Beginner,
        Intermediate,
        Advanced
    }
}
