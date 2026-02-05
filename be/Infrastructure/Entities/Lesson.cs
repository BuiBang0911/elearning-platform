using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class Lesson : BaseEntity
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }

        public virtual Course Course { get; set; }
        public virtual ICollection<Document> Documents { get; set; }
    }
}
