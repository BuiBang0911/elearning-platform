using ApplicationCore.Services.Lessons;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Web.DTO;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LessonController : BaseEntityController<Lesson, LessonRequest, LessonUpdateRequest, LessonResponse>
    {
        private readonly ILessonService _lessonService;
        private readonly IMapper _mapper;
        public LessonController(ILessonService lessonService, IMapper mapper) : base(lessonService, mapper) { }
    }
}
