using ApplicationCore.DTO;
using ApplicationCore.Mapping;
using Infrastructure.Entities;

namespace Web.Mapping
{
    public class ChatSessionMapping : BaseMapping<ChatSession, ChatSessionRequest, ChatSessionUpdateRequest, ChatSessionResponse>
    {
        public ChatSessionMapping()
        {
            CreateMap<ChatSession, ChatSessionResponse>()
                .ForMember(dest => dest.CourseId, opt => opt.MapFrom(src => src.Lesson != null ? src.Lesson.CourseId : (int?)null));
        }
    }
}
