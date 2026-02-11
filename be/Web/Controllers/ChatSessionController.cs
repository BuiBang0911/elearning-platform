using ApplicationCore.Services.Auth;
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
        private readonly IMapper _mapper;
        private readonly IAuthService _authService;

        public ChatSessionController(IChatSessionService chatSessionService, IMapper mapper, IAuthService authService) : base(chatSessionService, mapper)
        {
            _chatSessionService = chatSessionService;
            _mapper = mapper;
            _authService = authService;
        }

        [Authorize]
        [HttpGet("get-list-by-userId")]
        public async Task<IActionResult> GetListChatSessionByUserId()
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();
            var li = _chatSessionService.GetListChatSessionByUserId(userId.Value);

            return Ok(li);
        }
    }
}
