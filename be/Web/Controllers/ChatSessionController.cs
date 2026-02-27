using ApplicationCore.Constants;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.ChatMessages;
using ApplicationCore.Services.ChatSessions;
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
    public class ChatSessionController : BaseEntityController<ChatSession, ChatSessionRequest, ChatSessionUpdateRequest, ChatSessionResponse>
    {
        private readonly IChatSessionService _chatSessionService;
        private readonly IChatMessageService _chatMessageService;
        private readonly IMapper _mapper;
        private readonly IAuthService _authService;

        public ChatSessionController(IChatSessionService chatSessionService, IChatMessageService chatMessageService, IMapper mapper, IAuthService authService) : base(chatSessionService, mapper)
        {
            _chatSessionService = chatSessionService;
            _mapper = mapper;
            _authService = authService;
            _chatMessageService = chatMessageService;
        }

        [Authorize]
        [HttpGet("get-list-by-current-user")]
        public async Task<IActionResult> GetListChatSessionByUserId()
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();
            var li = await _chatSessionService.GetListChatSessionByUserId(userId.Value);
            var res = _mapper.Map<List<ChatSessionResponse>>(li);
            return Ok(res);
        }

        [Authorize]
        [HttpPost("create-new-chat")]
        public async Task<IActionResult> CreateNewChat()
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var chatSession = new ChatSession
            {
                UserId = userId.Value,
                Title = AppConstants.DefaultChatSessionTitle
            };  

            var res = await _chatSessionService.AddAndReturnAsync(chatSession);
            return Ok(_mapper.Map<ChatSessionResponse>(res));
        }

        [Authorize]
        [HttpPost("delete-new-chat/{id}")]
        public async Task<IActionResult> DeleteNewChat(int id)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var newChat = await _chatSessionService.FirstOrDefaultAsync(x => x.Id == id);

            if (newChat == null) return BadRequest();

            var li = await _chatMessageService.FirstOrDefaultAsync(x => x.SessionId == id);

            if (li == null)
            {
                await _chatSessionService.DeleteAsync(newChat);
            }
            return Ok();
        }
    }
}
