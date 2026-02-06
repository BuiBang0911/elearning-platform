namespace Web.DTO
{
    public class ChatMessageRequest : PagingRequest
    {
        public int SessionId { get; set; }
        public string Role { get; set; } // user | assistant
        public string Content { get; set; }
    }

    public class ChatMessageResponse : BaseDto
    {
        public string Role { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChatMessageUpdateRequest
    {
        public int SessionId { get; set; }
        public string Role { get; set; } 
        public string Content { get; set; }
    }
}
