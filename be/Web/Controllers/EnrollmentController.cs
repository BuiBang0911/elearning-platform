using ApplicationCore.Data;
using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Enrollments;
using ApplicationCore.Services.Users;
using AutoMapper;
using Azure.Core;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq.Expressions;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollmentController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;
        private readonly IAuthService _authService;
        private readonly IUserService _userService;
        private readonly ICourseService _courseService;
        private readonly IMapper _mapper;

        public EnrollmentController(IEnrollmentService enrollmentService, IAuthService authService, IUserService userService, ICourseService courseService, IMapper mapper)
        {
            _enrollmentService = enrollmentService;
            _authService = authService;
            _userService = userService;
            _courseService = courseService;
            _mapper = mapper;
        }

        [HttpPost("get-enrollments")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<ActionResult<PagedList<Enrollment>>> GetStudent(PagingRequest pagingRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            var enr = await _enrollmentService.GetPagedListAsync(
                where: x => x.Course.LecturerId == userId,
                orderBy: x => x.JoinedAt,
                page: pagingRequest.PageIndex,
                count: pagingRequest.PageSize,
                earlyLoad: x => x.Course);

            var users = new PagedList<UserResponse>(enr.Items.Select(x => _mapper.Map<UserResponse>(x.User)), enr.PageIndex, enr.PageSize, enr.TotalCount);

            return Ok(users);
        }

        [HttpPost("get-students")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<ActionResult<IEnumerable<UserResponse>>> GetStudentsCorrectWay(PagingRequest pagingRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            var result = await _userService.GetPagedListAsync(
                where: u => u.Enrollments.Any(e => e.Course.LecturerId == userId),
                orderBy: u => u.FullName,
                ascending: true,
                page: pagingRequest.PageIndex,
                count: pagingRequest.PageSize
            );

            // var userResponses = _mapper.Map<List<UserResponse>>(result);

            var pagedResult = new PagedList<UserResponse>(
                _mapper.Map<List<UserResponse>>(result.Items),
                result.PageIndex,
                result.PageSize,
                result.TotalCount
            );

            return Ok(result);
        }

        [HttpGet("get-total-students")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<IActionResult> GetTotalStudents()
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            var result = await _userService.GetAsync(
                where: u => u.Enrollments.Any(e => e.Course.LecturerId == userId)
            );

            return Ok(result.Count());
        }

        [HttpGet("get-courses-by-student/{id}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<ActionResult<IEnumerable<CourseResponse>>> GetByStudent(int id)
        {
            var instructorId = _authService.UserId;
            if (instructorId == null) return Unauthorized("Invalid token");

            var enrollments = await _enrollmentService.GetAsync(
                where: e => e.UserId == id && e.Course.LecturerId == instructorId,
                orderBy: e => e.Course.Title,
                ascending: true,
                earlyLoad: x => x.Course
            );

            var courses = enrollments.Select(e => e.Course).ToList();

            var response = _mapper.Map<IEnumerable<CourseResponse>>(courses);

            return Ok(response);
        }

        [HttpGet("get-student-by-course/{id}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<ActionResult<IEnumerable<UserResponse>>> GetStudentByCourse(int id)
        {
            var instructorId = _authService.UserId;
            if (instructorId == null) return Unauthorized("Invalid token");

            var students = await _enrollmentService.GetAsync(x => x.CourseId == id, earlyLoad: x => x.User);

            var response = _mapper.Map<IEnumerable<UserResponse>>(students);

            return Ok(response);
        }

        [HttpPost("enroll/{courseId}")]
        [Authorize(Roles = $"{nameof(UserRole.Student)}")]
        public async Task<IActionResult> Enroll(int courseId)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            await _enrollmentService.EnrollAsync(userId.Value, courseId);

            return Ok();
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<IActionResult> Approve(int id)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            await _enrollmentService.ApproveAsync(id, userId.Value);

            return Ok();
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<IActionResult> Reject(int id)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            await _enrollmentService.RejectAsync(id, userId.Value);

            return Ok();
        }

        [HttpGet("pending/{courseId}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<IActionResult> GetPending(int courseId)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var data = await _enrollmentService.GetPendingAsync(courseId);
            return Ok(data);
        }

        [HttpPost("update-rating")]
        [Authorize(Roles = $"{nameof(UserRole.Student)}")]
        public async Task<IActionResult> UpdateRating([FromBody] UpdateRatingRequest request)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var enrollment = await _enrollmentService.FirstOrDefaultAsync(e => e.CourseId == request.CourseId && e.UserId == userId.Value);

            if (enrollment == null)
                return NotFound("Enrollment not found");

            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest("Rating must be between 1 and 5");

            enrollment.rating = request.Rating;

            await _enrollmentService.UpdateAsync(enrollment);
            await _courseService.UpdateCourseRatingAsync(request.CourseId);

            return Ok();
        }
    }
}
