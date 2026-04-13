using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class ChatSession : BaseEntity
    {
        public int UserId { get; set; }
        public int? LessonId { get; set; } 
        public string Title { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; }
        public virtual Lesson? Lesson { get; set; }
        public virtual ICollection<ChatMessage> Messages { get; set; }
    }
}
