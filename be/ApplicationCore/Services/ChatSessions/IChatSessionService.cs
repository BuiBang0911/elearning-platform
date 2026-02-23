using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.ChatSessions
{
    public interface IChatSessionService : IBaseService<ChatSession>
    {
        Task<List<ChatSession>> GetListChatSessionByUserId(int userId);
    }
}
