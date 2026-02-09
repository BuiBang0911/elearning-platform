using ApplicationCore.Services.ChatSessions;
using ApplicationCore.Services.Documents;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        public ChatSessionController(IChatSessionService chatSessionService, IMapper mapper) : base(chatSessionService, mapper)
        {
            _chatSessionService = chatSessionService;
        }
    }
}
