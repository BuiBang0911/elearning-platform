using ApplicationCore.Services.Auth;
using ApplicationCore.Services.ChatMessages;
using ApplicationCore.Services.Documents;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Web.DTO;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = nameof(UserRole.Admin))]
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
        public async Task<IActionResult> AskAiAssistant(int sessionId, string message)
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();

            await _chatMessageService.AddChatMessageAsync(sessionId, ChatbotRole.User, message);

            var client = _clientFactory.CreateClient();
            var payload = new QueryRequest { Question = message };
            var response = await client.PostAsJsonAsync("http://localhost:8000/api/chat", payload);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<QueryResponse>();
                await _chatMessageService.AddChatMessageAsync(sessionId, ChatbotRole.AiAssistant, result.Answer);
                return Ok(result);
            }

            return StatusCode(500, "AI Service error!");
        }
    }
}
