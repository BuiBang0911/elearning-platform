namespace Web.DTO
{
    public class DocumentRequest : PagingRequest
    {
        public int LessonId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }

    public class DocumentResponse : BaseDto
    {
        public int LessonId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class DocumentUpdateRequest
    {
        public int LessonId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }
}
