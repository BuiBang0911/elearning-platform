using ApplicationCore.DTOs;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly IAuthService _authService;

        public DashboardController(IDashboardService dashboardService, IAuthService authService)
        {
            _dashboardService = dashboardService;
            _authService = authService;
        }

        [HttpGet("student-stats")]
        public async Task<ActionResult<StudentStatsDto>> GetStudentStats()
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            var stats = await _dashboardService.GetStudentDashboardStatsAsync(userId.Value);
            return Ok(stats);
        }

        [HttpGet("instructor-stats")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<InstructorDashboardStatsDto>> GetInstructorStats()
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            var stats = await _dashboardService.GetInstructorDashboardStatsAsync(userId.Value);
            return Ok(stats);
        }

        [HttpGet("course-stats/{courseId}")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<CourseDetailStatsDto>> GetCourseStats(int courseId)
        {
            var stats = await _dashboardService.GetCourseDetailStatsAsync(courseId);
            if (stats == null) return NotFound();
            return Ok(stats);
        }
    }
}
