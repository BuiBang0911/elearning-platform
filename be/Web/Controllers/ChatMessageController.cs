using ApplicationCore.Constants;
using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.ChatMessages;
using ApplicationCore.Services.Enrollments;
using ApplicationCore.Services.Lessons;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using StackExchange.Redis;
using System.Security.Claims;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatMessageController : BaseEntityController<ChatMessage, ChatMessageRequest, ChatMessageUpdateRequest, ChatMessageResponse>
    {
        private readonly IChatMessageService _chatMessageService;
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;
        private readonly IHttpClientFactory _clientFactory;
        private readonly IEnrollmentService _enrollmentService;
        private readonly ILessonService _lessonService;
        private readonly IConfiguration _configuration;

        public ChatMessageController(IChatMessageService chatMessageService, IAuthService authService, IMapper mapper, IHttpClientFactory clientFactory, IEnrollmentService enrollmentService, ILessonService lessonService, IConfiguration configuration) : base(chatMessageService, mapper)
        {
            _chatMessageService = chatMessageService;
            _authService = authService;
            _mapper = mapper;
            _clientFactory = clientFactory;
            _enrollmentService = enrollmentService;
            _lessonService = lessonService;
            _configuration = configuration;
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
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> AskAiAssistant([FromBody] AskAiRequest askAiRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();


            var lesson = await _lessonService.FirstOrDefaultAsync(l => l.Id == askAiRequest.LessonId);
            if (lesson == null) return NotFound("Lesson not found");
            
            var isEnrolled = await _enrollmentService.FirstOrDefaultAsync(e => e.UserId == userId.Value && e.CourseId == lesson.CourseId);
            if (isEnrolled == null && !User.IsInRole(nameof(UserRole.Instructor)) && !User.IsInRole(nameof(UserRole.Admin)))
            {
                return Forbid("You must be enrolled in this course to use AI Assistant.");
            }

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

                var aiUrl = _configuration["AIService:Url"] ?? "http://localhost:8000";
                var response = await client.PostAsJsonAsync($"{aiUrl}/api/chat", payload);

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
        [EnableRateLimiting("AiPolicy")]
        public async Task AskAiAssistantStream([FromBody] AskAiRequest askAiRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) {
                Response.StatusCode = 401;
                return;
            }

            // Verify enrollment
            var lesson = await _lessonService.FirstOrDefaultAsync(l => l.Id == askAiRequest.LessonId);
            if (lesson == null) {
                Response.StatusCode = 404;
                return;
            }
            
            var isEnrolled = await _enrollmentService.FirstOrDefaultAsync(e => e.UserId == userId.Value && e.CourseId == lesson.CourseId);
            if (isEnrolled == null && !User.IsInRole(nameof(UserRole.Instructor)) && !User.IsInRole(nameof(UserRole.Admin)))
            {
                Response.StatusCode = 403;
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
                var aiUrl = _configuration["AIService:Url"] ?? "http://localhost:8000";
                var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{aiUrl}/api/chat/stream")
                {
                    Content = JsonContent.Create(payload)
                };
                var response = await client.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode) {
                    Response.StatusCode = (int)response.StatusCode;
                    return;
                }

                Response.ContentType = "text/event-stream";
                Response.Headers.Append("Cache-Control", "no-cache");
                Response.Headers.Append("X-Accel-Buffering", "no"); // Disable buffering for Nginx/Proxies
                
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
