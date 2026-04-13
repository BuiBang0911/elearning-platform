namespace ApplicationCore.DTO
{
    public class ChatSessionRequest : PagingRequest
    {
        public int UserId { get; set; }
        public string Title { get; set; }
        public int? LessonId { get; set; }
    }

    public class ChatSessionResponse : BaseDto
    {
        public int UserId { get; set; }
        public string Title { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? LessonId { get; set; }
        public int? CourseId { get; set; }
    }

    public class ChatSessionUpdateRequest
    {
        public int UserId { get; set; }
        public string Title { get; set; }
        public int? LessonId { get; set; }
    }
}
