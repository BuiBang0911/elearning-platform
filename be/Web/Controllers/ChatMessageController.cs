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

        public ChatMessageController(IChatMessageService chatMessageService, IAuthService authService, IMapper mapper) : base(chatMessageService, mapper)
        {
            _chatMessageService = chatMessageService;
            _authService = authService;
            _mapper = mapper;
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
    }
}
