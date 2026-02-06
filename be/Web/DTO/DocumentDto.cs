namespace Web.DTO
{
    public class DocumentRequest
    {
        public int LessonId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }

    public class DocumentResponse : BaseDto
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
