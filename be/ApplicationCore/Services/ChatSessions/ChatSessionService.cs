using ApplicationCore.Data;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.ChatSessions
{
    public class ChatSessionService : BaseService<ChatSession>, IChatSessionService
    {
        private readonly IRepository<ChatSession> _repository;
        public ChatSessionService(IRepository<ChatSession> repository) : base(repository) { 
            _repository = repository;
        }

        public async Task<List<ChatSession>> GetListChatSessionByUserId(int id)
        {
            var li = await _repository.GetAsync<ChatSession>(x => x.UserId == id);

            if (li == null) return null;

            return li.ToList();
        }
    }
}
