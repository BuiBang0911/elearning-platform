using ApplicationCore.DTOs;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Dashboard;
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
    }
}
