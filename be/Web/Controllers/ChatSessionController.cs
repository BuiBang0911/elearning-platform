using ApplicationCore.Services.ChatSessions;
using ApplicationCore.Services.Documents;
using AutoMapper;
using Infrastructure.Entities;
using Web.DTO;

namespace Web.Controllers
{
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
