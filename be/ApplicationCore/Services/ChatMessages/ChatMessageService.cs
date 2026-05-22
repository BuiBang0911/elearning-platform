using ApplicationCore.Data;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.ChatMessages
{
    public class ChatMessageService : BaseService<ChatMessage>, IChatMessageService
    {
        private readonly IRepository<ChatMessage> _chatMessagesRepository;
        private readonly IRepository<ChatSession> _chatSessionRepository;
        private readonly IRepository<User> _userRepository;
        public ChatMessageService(IRepository<ChatMessage> chatMessagesRepository, IRepository<ChatSession> chatSessionRepository, IRepository<User> userRepository) : base(chatMessagesRepository) {
            _chatMessagesRepository = chatMessagesRepository;
            _userRepository = userRepository;
            _chatSessionRepository = chatSessionRepository;
        }

        public async Task<ChatMessage> AddChatMessageAsync(int SessionId, ChatbotRole Role, string Content)
        {
            var chatMessage = new ChatMessage
            {
                SessionId = SessionId,
                Role = Role,
                Content = Content
            };

            await _chatMessagesRepository.AddAsync(chatMessage);

            // Cập nhật Title cho ChatSession nếu chưa có
            if (Role == ChatbotRole.User)
            {
                var session = await _chatSessionRepository.GetByIdAsync(SessionId);
                if (session != null && (string.IsNullOrEmpty(session.Title) || session.Title == "New Chat"))
                {
                    // Lấy khoảng 40 ký tự đầu làm title
                    string newTitle = Content.Length > 40 ? Content.Substring(0, 37) + "..." : Content;
                    session.Title = newTitle;
                    await _chatSessionRepository.UpdateAsync(session);
                }
            }

            return chatMessage;
        }

        public async Task<List<ChatMessage>> GetChatSessionDetail(int sessionId, int userId)
        {
            var session = await _chatSessionRepository.FirstOrDefaultAsync(x=> x.Id == sessionId && x.UserId == userId);

            if (session == null) throw new Exception("Not found!");

            var li = await _chatMessagesRepository.GetAsync<ChatMessage>(x => x.SessionId == sessionId);

            if (li == null) return new List<ChatMessage>();

            return li.ToList();
        }
    }
}
