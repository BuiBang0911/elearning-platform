using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class Document : BaseEntity
    {
        public int LessonId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; } // Link to RAG Source
        public double Size { get; set; }
        public FileStatus Status { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public virtual Lesson Lesson { get; set; }
    }

    public enum FileStatus
    {
        Idle = 0,        
        Uploading = 1,   
        Uploaded = 2,    
        Processing = 3,  
        Processed = 4,  
        Failed = 5     
    }
}
