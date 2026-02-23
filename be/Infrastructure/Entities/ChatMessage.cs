using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class ChatMessage : BaseEntity
    {
        public int SessionId { get; set; }
        public string Role { get; set; } // user | assistant
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ChatSession Session { get; set; }
    }
}
