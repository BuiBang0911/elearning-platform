using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Documents;
using ApplicationCore.Services.Lessons;
using ApplicationCore.Services.Storage;
using ApplicationCore.Services.Users;
using AutoMapper;
using Azure;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using Web.Controllers;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseController : BaseEntityController<Course, CourseRequest, CourseUpdateRequest, CourseResponse>
    {
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;
        private readonly IDocumentService _documentService;
        private readonly IMapper _mapper;
        private readonly IStorageService _storageService;
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public CourseController(ICourseService courseService, ILessonService lessonService, IDocumentService documentService, IStorageService storageService, IAuthService authService, IUserService userService, IMapper mapper) : base(courseService, mapper)
        {
            _courseService = courseService;
            _lessonService = lessonService;
            _documentService = documentService;
            _mapper = mapper;
            _userService = userService;
            _storageService = storageService;
            _authService = authService;
        }

        public override  async Task<ActionResult<IEnumerable<CourseResponse>>> GetAll()
        {
            var list = await _courseService.GetAsync(earlyLoad: [x => x.Lecturer, x => x.Category]);
            var res = _mapper.Map<IEnumerable<CourseResponse>>(list);
            return Ok(res);
        }

        [HttpPost]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public override async Task<ActionResult<CourseResponse>> Create([FromForm] CourseUpdateRequest request)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            request.LecturerId = userId;

            string? resultUrl = null;

            if (request.Thumbnail != null)
            {
                // 1. Validate File Size (Max 2MB)
                const long maxFileSize = 2 * 1024 * 1024;
                if (request.Thumbnail.Length > maxFileSize)
                {
                    return BadRequest("Thumbnail size exceeds 2MB limit.");
                }

                // 2. Validate File Extension
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var extension = Path.GetExtension(request.Thumbnail.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Invalid image format. Supported formats: .jpg, .jpeg, .png, .webp");
                }

                resultUrl = await _storageService.UploadFileAsync(request.Thumbnail);
                if (string.IsNullOrEmpty(resultUrl))
                {
                    return BadRequest("Cannot upload file.");
                }
            }

            var couseR = _mapper.Map<Course>(request);
            couseR.Thumbnail = resultUrl;
            var res = await _courseService.AddAndReturnAsync(couseR);

            var course = _mapper.Map<CourseResponse>(res);

            return Ok(course);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Instructor)}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var entity = await _courseService.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            var liLesson = await _lessonService.GetAsync(x => x.CourseId == id);

            foreach (var lesson in liLesson) {
                var liDocument = await _documentService.GetAsync(x => x.LessonId == id);
                foreach (var document in liDocument) {
                    await _documentService.DeleteAsync(document);
                }
                await _lessonService.DeleteAsync(lesson);
            }

            await _courseService.DeleteAsync(entity);
            return NoContent();
        }

        [HttpGet("get-course-dashboard")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<ActionResult<IEnumerable<CourseDashboardResponse>>> GetAllCourseForLecture()
        {
            var userId = _authService.UserId;

            if (userId == null) return Unauthorized();

            var list = await _courseService.GetAsync(x => x.LecturerId == userId, earlyLoad: [x => x.Enrollments, x => x.Category]);

            var res = list.Select(x => new CourseDashboardResponse
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                LecturerId = x.LecturerId,
                CreatedAt = x.CreatedAt,
                Thumbnail = x.Thumbnail,
                Level = x.Level,
                Rating = x.Rating,
                CategoryName = x.Category?.Name,
                CategoryId = x.CategoryId,
                Students = x.Enrollments.Count(),
                Price = x.Price
            });
            return Ok(res);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public override async Task<IActionResult> Update(int id, [FromForm] CourseUpdateRequest request)
        {
            var entity = await _courseService.FirstOrDefaultAsync(x => x.Id == id, earlyLoad: [x => x.Enrollments, x => x.Category, x => x.Lecturer]);
            if (entity == null) return NotFound();

            if (request.Thumbnail != null)
            {
                // 1. Validate File Size (Max 2MB)
                const long maxFileSize = 2 * 1024 * 1024;
                if (request.Thumbnail.Length > maxFileSize)
                {
                    return BadRequest("Thumbnail size exceeds 2MB limit.");
                }

                // 2. Validate File Extension
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var extension = Path.GetExtension(request.Thumbnail.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Invalid image format. Supported formats: .jpg, .jpeg, .png, .webp");
                }

                var resultUrl = await _storageService.UploadFileAsync(request.Thumbnail);
                if (!string.IsNullOrEmpty(resultUrl))
                {
                    entity.Thumbnail = resultUrl;
                }
            }

            _mapper.Map(request, entity);
            await _courseService.UpdateAsync(entity);

            var res = new CourseDashboardResponse
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                LecturerId = entity.LecturerId,
                CreatedAt = entity.CreatedAt,
                Thumbnail = entity.Thumbnail,
                Level = entity.Level,
                Rating = entity.Rating,
                CategoryName = entity.Category?.Name,
                CategoryId = entity.CategoryId,
                Students = entity.Enrollments?.Count() ?? 0,
                Price = entity.Price
            };

            return Ok(res);
        }

        [HttpPost("course-by-student-dashboard/{studentId}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<IActionResult> GetStudentDashboard(int studentId)
        {
            var userId = _authService?.UserId;
            if (userId == null) return Unauthorized();

            var result = await _courseService.CourseByStudentDashboard(
                studentId,
                null,
                userId
            );

            return Ok(result);
        }

        [HttpGet("{courseId}/documents/search")]
        public async Task<IActionResult> SearchDocuments(int courseId, [FromQuery] string? searchTerm)
        {
            var results = await _documentService.SearchDocumentsInCourseAsync(courseId, searchTerm);

            if (results == null || !results.Any())
            {
                return NotFound();
            }

            return Ok(results);
        }

        [HttpGet("get-courses-for-student")]
        [Authorize(Roles = $"{nameof(UserRole.Student)}")]
        public async Task<IActionResult> GetCoursesForStudent()
        {
            var userId = _authService?.UserId;
            if (userId == null) return Unauthorized();

            var res = await _courseService.GetCoursesForStudentAsync(userId.Value);

            return Ok(res);
        }

        [HttpPost("get-top-rated-courses")]
        public async Task<IActionResult> GetTopRatedCoursesAsync([FromBody] PagingRequest pagingRequest)
        {
            var courses = await _courseService.GetTopRatedCoursesPagedAsync(pagingRequest.PageIndex, pagingRequest.PageSize);

            return Ok(courses);
        }

        [HttpPost("get-all-course-for-student")]
        [Authorize(Roles = $"{nameof(UserRole.Student)}")]
        public async Task<IActionResult> GetAllCoursesForStudentAsync([FromBody] PagingRequest pagingRequest, [FromQuery] string? search)
        {
            var userId = _authService?.UserId;
            if (userId == null) return Unauthorized();
            var courses = await _courseService.GetAllCoursesForStudentAsync(userId, search, pagingRequest.PageIndex, pagingRequest.PageSize);

            return Ok(courses);
        }

        [HttpGet("student/detail/{id}")]
        public async Task<IActionResult> GetCourseDetailForStudent(int id)
        {
            var userId = _authService?.UserId;

            var courseDetail = await _courseService.GetCourseDetailForStudentAsync(id, userId);

            if (courseDetail == null) return NotFound();

            return Ok(courseDetail);
        }
    }
}
