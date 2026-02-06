namespace Web.DTO
{
    public class ChatSessionRequest
    {
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; }
    }

    public class ChatSessionResponse : BaseDto
    {
        public string Title { get; set; }
        public string CourseTitle { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
