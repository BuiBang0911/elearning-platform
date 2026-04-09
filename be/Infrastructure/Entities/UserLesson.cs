using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class UserLesson : BaseEntity
    {
        public int UserId { get; set; }
        public User User { get; set; }

        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }

        public bool IsCompleted { get; set; }   
        public DateTime? CompletedAt { get; set; } = DateTime.Now;
    }
}
