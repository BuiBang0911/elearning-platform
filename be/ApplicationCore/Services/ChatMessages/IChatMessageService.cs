using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.ChatMessages
{
    public interface IChatMessageService : IBaseService<ChatMessage>
    {
        Task<ChatMessage> AddChatMessageAsync(int SessionId, ChatbotRole Role, string Content);
        Task<List<ChatMessage>> GetChatSessionDetail(int sessionId, int userId);
    }
}
