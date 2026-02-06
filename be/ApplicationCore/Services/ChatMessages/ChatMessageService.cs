using ApplicationCore.Data;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.ChatMessages
{
    public class ChatMessageService : BaseService<ChatMessage>, IChatMessageService
    {
        private readonly IRepository<ChatMessage> _chatMessagesRepository;
        public ChatMessageService(IRepository<ChatMessage> chatMessagesRepository) : base(chatMessagesRepository) { }
    }
}
