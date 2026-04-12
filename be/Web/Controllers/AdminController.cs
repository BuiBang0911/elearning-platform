using ApplicationCore.DTOs;
using ApplicationCore.Services.Admin;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("dashboard-stats")]
        public async Task<ActionResult<AdminDashboardStatsDto>> GetDashboardStats()
        {
            var stats = await _adminService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<AdminUserListDto>>> GetUsers()
        {
            var users = await _adminService.GetUsersAsync();
            return Ok(users);
        }

        [HttpPost("users/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(int userId)
        {
            var result = await _adminService.ToggleUserStatusAsync(userId);
            if (!result) return NotFound();
            return Ok();
        }

        [HttpGet("courses")]
        public async Task<ActionResult<List<AdminCourseListDto>>> GetCourses()
        {
            var courses = await _adminService.GetCoursesAsync();
            return Ok(courses);
        }

        [HttpDelete("courses/{courseId}")]
        public async Task<IActionResult> DeleteCourse(int courseId)
        {
            var result = await _adminService.DeleteCourseAsync(courseId);
            if (!result) return NotFound();
            return Ok();
        }
    }
}
