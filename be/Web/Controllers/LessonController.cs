using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Lessons;
using ApplicationCore.Services.Storage;
using ApplicationCore.Services.UserLessons;
using Ardalis.Specification;
using AutoMapper;
using Azure;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.IO;
using System.Linq;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LessonController : BaseEntityController<Lesson, LessonRequest, LessonUpdateRequest, LessonResponse>
    {
        private readonly ILessonService _lessonService;
        private readonly IMapper _mapper;
        private readonly IAuthService _authService;
        private readonly ICourseService _courseService;
        private readonly IUserLessonService _userLessonService;
        private readonly IStorageService _storageService;

        public LessonController(ILessonService lessonService, IAuthService authService, ICourseService courseService, IUserLessonService userLessonService, IMapper mapper, IStorageService storageService) : base(lessonService, mapper) {
            _authService = authService;
            _mapper = mapper;
            _lessonService = lessonService;
            _courseService = courseService;
            _userLessonService = userLessonService;
            _storageService = storageService;
        }

        [HttpGet("get-lessons-in-course/{id}")]
        public async Task<ActionResult<List<LessonResponse>>> GetLessonInCourse(int id)
        {
            var lessons = await _lessonService.GetAsync(x => x.CourseId == id);

            var res = _mapper.Map<List<LessonResponse>>(lessons);

            return Ok(res);
        }

        [HttpPost]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        [EnableRateLimiting("UploadPolicy")]
        public override async Task<ActionResult<LessonResponse>> Create([FromForm] LessonUpdateRequest rq)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var course = await _courseService.FirstOrDefaultAsync(x => x.Id == rq.CourseId);

            if (course == null) return BadRequest();
            if (course.LecturerId != userId) return BadRequest("Not permission!");

            var entity = _mapper.Map<Lesson>(rq);

            if (rq.VideoFile != null)
            {
                // 1. Validate File Size (Max 100MB)
                const long maxFileSize = 100 * 1024 * 1024;
                if (rq.VideoFile.Length > maxFileSize)
                {
                    return BadRequest("Video file size exceeds 100MB limit.");
                }

                // 2. Validate File Extension
                var allowedExtensions = new[] { ".mp4", ".mov", ".avi", ".mkv" };
                var extension = Path.GetExtension(rq.VideoFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Invalid video format. Supported formats: .mp4, .mov, .avi, .mkv");
                }

                var videoUrl = await _storageService.UploadFileAsync(rq.VideoFile);
                if (!string.IsNullOrEmpty(videoUrl))
                {
                    entity.VideoUrl = videoUrl;
                }
            }

            var result = await _lessonService.AddAndReturnAsync(entity);
            var res = _mapper.Map<LessonResponse>(result);
            return Ok(res);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        [EnableRateLimiting("UploadPolicy")]
        public override async Task<IActionResult> Update(int id, [FromForm] LessonUpdateRequest rq)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var entity = await _lessonService.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null) return NotFound();

            var course = await _courseService.FirstOrDefaultAsync(x => x.Id == entity.CourseId);
            if (course == null || course.LecturerId != userId) return BadRequest("Not permission!");

            _mapper.Map(rq, entity);

            if (rq.VideoFile != null)
            {
                // 1. Validate File Size (Max 100MB)
                const long maxFileSize = 100 * 1024 * 1024;
                if (rq.VideoFile.Length > maxFileSize)
                {
                    return BadRequest("Video file size exceeds 100MB limit.");
                }

                // 2. Validate File Extension
                var allowedExtensions = new[] { ".mp4", ".mov", ".avi", ".mkv" };
                var extension = Path.GetExtension(rq.VideoFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Invalid video format. Supported formats: .mp4, .mov, .avi, .mkv");
                }

                // Optionally delete old video
                if (!string.IsNullOrEmpty(entity.VideoUrl))
                {
                    await _storageService.DeleteFileAsync(entity.VideoUrl);
                }

                var videoUrl = await _storageService.UploadFileAsync(rq.VideoFile);
                if (!string.IsNullOrEmpty(videoUrl))
                {
                    entity.VideoUrl = videoUrl;
                }
            }

            await _lessonService.UpdateAsync(entity);
            var res = _mapper.Map<LessonResponse>(entity);
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
