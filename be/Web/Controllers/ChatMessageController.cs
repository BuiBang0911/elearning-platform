using ApplicationCore.Constants;
using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.ChatMessages;
using ApplicationCore.Services.Documents;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System.Security.Claims;
using System.Net.Http.Json;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = nameof(UserRole.Admin))]
    public class ChatMessageController : BaseEntityController<ChatMessage, ChatMessageRequest, ChatMessageUpdateRequest, ChatMessageResponse>
    {
        private readonly IChatMessageService _chatMessageService;
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;
        private readonly IHttpClientFactory _clientFactory;

        public ChatMessageController(IChatMessageService chatMessageService, IAuthService authService, IMapper mapper, IHttpClientFactory clientFactory) : base(chatMessageService, mapper)
        {
            _chatMessageService = chatMessageService;
            _authService = authService;
            _mapper = mapper;
            _clientFactory = clientFactory;
        }

        [Authorize]
        [HttpGet("session/{id}")]
        public async Task<IActionResult> GetChatSessionDetail(int id)
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();
            var li = await _chatMessageService.GetChatSessionDetail(id, userId.Value);

            var res = _mapper.Map<List<ChatMessageResponse>>(li);
            return Ok(res);
        }

        [Authorize]
        [HttpPost("ask-ai")]
        public async Task<IActionResult> AskAiAssistant([FromBody] AskAiRequest askAiRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();

            await _chatMessageService.AddChatMessageAsync(askAiRequest.SessionId, ChatbotRole.User, askAiRequest.Message);

            var messageHistories = await _chatMessageService.GetAsync(x => x.SessionId == askAiRequest.SessionId, x => x.CreatedAt, false, count: AppConstants.ChatHistoryCount);

            var chatHistory = new List<ChatHistoryForAi>();

            foreach(var chatMessage in messageHistories)
            {
                var chatHistoryForAi = new ChatHistoryForAi
                {
                    Role = chatMessage.Role.ToString(),
                    Content = chatMessage.Content,
                };

                chatHistory.Add(chatHistoryForAi);
            }

            try
            {
                var client = _clientFactory.CreateClient();

                var payload = new QueryRequest
                {
                    Question = askAiRequest.Message,
                    ChatHistory = chatHistory,
                };

                var response = await client.PostAsJsonAsync("http://localhost:8000/api/chat", payload);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<QueryResponse>();
                    var chatMessage = await _chatMessageService.AddChatMessageAsync(askAiRequest.SessionId, ChatbotRole.AiAssistant, result.Answer);
                    return Ok(_mapper.Map<ChatMessageResponse>(chatMessage));
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            return StatusCode(500, "AI Service error!");
        }

        [Authorize]
        [HttpPost("ask-ai-stream")]
        public async Task AskAiAssistantStream([FromBody] AskAiRequest askAiRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) {
                Response.StatusCode = 401;
                return;
            }

            // 1. Lấy lịch sử (Trước khi lưu tin nhắn mới để tránh lặp ngữ cảnh)
            var messageHistories = await _chatMessageService.GetAsync(x => x.SessionId == askAiRequest.SessionId, x => x.CreatedAt, false, count: AppConstants.ChatHistoryCount);
            var chatHistory = messageHistories.Select(m => new ChatHistoryForAi { 
                Role = m.Role.ToString(), 
                Content = m.Content 
            }).ToList();

            // 2. Lưu tin nhắn người dùng mới
            await _chatMessageService.AddChatMessageAsync(askAiRequest.SessionId, ChatbotRole.User, askAiRequest.Message);

            try {
                var client = _clientFactory.CreateClient();
                var payload = new QueryRequest { 
                    Question = askAiRequest.Message, 
                    ChatHistory = chatHistory,
                    LessonId = askAiRequest.LessonId
                };

                // Gọi Python Stream dùng HttpRequestMessage để hỗ trợ ResponseHeadersRead
                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "http://localhost:8000/api/chat/stream")
                {
                    Content = JsonContent.Create(payload)
                };
                var response = await client.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode) {
                    Response.StatusCode = (int)response.StatusCode;
                    return;
                }

                Response.ContentType = "text/event-stream";
                var fullAnswer = new System.Text.StringBuilder();

                using var stream = await response.Content.ReadAsStreamAsync();
                var buffer = new byte[1024];
                int bytesRead;

                while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                {
                    var chunk = System.Text.Encoding.UTF8.GetString(buffer, 0, bytesRead);
                    
                    // Lọc bỏ metadata khỏi nội dung lưu DB nhưng vẫn gửi về FE
                    if (!chunk.Contains("SOURCES_METADATA:")) {
                        fullAnswer.Append(chunk);
                    }
                    
                    await Response.WriteAsync(chunk);
                    await Response.Body.FlushAsync();
                }

                // 3. Lưu câu trả lời hoàn chỉnh của AI sau khi stream xong
                var finalAnswer = fullAnswer.ToString();
                if (!string.IsNullOrEmpty(finalAnswer)) {
                    await _chatMessageService.AddChatMessageAsync(askAiRequest.SessionId, ChatbotRole.AiAssistant, finalAnswer);
                }
            }
            catch (Exception ex) {
                Console.WriteLine($"Streaming Error: {ex.Message}");
                Response.StatusCode = 500;
            }
        }
    }
}
