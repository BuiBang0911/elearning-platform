using System.Text.Json.Serialization;

namespace Web.DTO
{
    public class QueryRequest
    {
        [JsonPropertyName("question")]
        public string Question { get; set; }

        [JsonPropertyName("chat_history")]
        public List<ChatHistoryForAi> ChatHistory { get; set; }
    }

    public class QueryResponse
    {
        public string Answer { get; set; }
        public List<string> Sources { get; set; }
    }

    public class ChatHistoryForAi
    {
        public string Role { get; set; }
        public string Content { get; set; }
    }
}
