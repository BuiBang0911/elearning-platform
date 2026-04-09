using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Lessons;
using ApplicationCore.Services.UserLessons;
using Ardalis.Specification;
using AutoMapper;
using Azure;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize()]
    public class LessonController : BaseEntityController<Lesson, LessonRequest, LessonUpdateRequest, LessonResponse>
    {
        private readonly ILessonService _lessonService;
        private readonly IMapper _mapper;
        private readonly IAuthService _authService;
        private readonly ICourseService _courseService;
        private readonly IUserLessonService _userLessonService;
        public LessonController(ILessonService lessonService, IAuthService authService, ICourseService courseService, IUserLessonService userLessonService, IMapper mapper) : base(lessonService, mapper) {
            _authService = authService;
            _mapper = mapper;
            _lessonService = lessonService;
            _courseService = courseService;
            _userLessonService = userLessonService;
        }

        [HttpGet("get-lessons-in-course/{id}")]
        public async Task<ActionResult<List<LessonResponse>>> GetLessonInCourse(int id)
        {
            var lessons = await _lessonService.GetAsync(x => x.CourseId == id);

            var res = _mapper.Map<List<LessonResponse>>(lessons);

            return Ok(res);
        }

        public override async Task<ActionResult<LessonResponse>> Create([FromBody] LessonUpdateRequest rq)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var course = await _courseService.FirstOrDefaultAsync(x => x.Id == rq.CourseId);

            if (course == null) return BadRequest();
            if (course.LecturerId != userId) return BadRequest("Not permission!");

            var entity = _mapper.Map<Lesson>(rq);
            var result = await _lessonService.AddAndReturnAsync(entity);
            var res = _mapper.Map<LessonResponse>(result);
            return Ok(res);
        }

        [HttpPost("{lessonId}/complete")]
        [Authorize(Roles = $"{nameof(UserRole.Student)}")]
        public async Task<IActionResult> CompleteLesson(int lessonId)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            await _userLessonService.CompleteLessonAsync(userId.Value, lessonId);

            return Ok();
        }

        [HttpPost("{lessonId}/uncomplete")]
        [Authorize(Roles = $"{nameof(UserRole.Student)}")]
        public async Task<IActionResult> UncompleteLesson(int lessonId)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            await _userLessonService.UncompleteLessonAsync(userId.Value, lessonId);

            return Ok();
        }
    }
}
