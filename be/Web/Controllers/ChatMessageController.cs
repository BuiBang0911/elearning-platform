using ApplicationCore.Services.ChatMessages;
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
    public class ChatMessageController : BaseEntityController<ChatMessage, ChatMessageRequest, ChatMessageUpdateRequest, ChatMessageResponse>
    {
        private readonly IChatMessageService _chatMessageService;
        private readonly IMapper _mapper;

        public ChatMessageController(IChatMessageService chatMessageService, IMapper mapper) : base(chatMessageService, mapper)
        {
            _chatMessageService = chatMessageService;
        }
    }
}
