using ApplicationCore.DTOs;
using ApplicationCore.Services.Admin;
using ApplicationCore.Services.Withdrawals;
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
        private readonly IWithdrawalService _withdrawalService;

        public AdminController(IAdminService adminService, IWithdrawalService withdrawalService)
        {
            _adminService = adminService;
            _withdrawalService = withdrawalService;
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

        // ===== WITHDRAWAL MANAGEMENT =====

        /// <summary>
        /// Lấy danh sách yêu cầu rút tiền (tất cả hoặc theo trạng thái)
        /// </summary>
        [HttpGet("withdrawals")]
        public async Task<IActionResult> GetWithdrawals([FromQuery] string? status = null)
        {
            try
            {
                WithdrawalStatus? statusFilter = null;
                if (!string.IsNullOrEmpty(status) && Enum.TryParse<WithdrawalStatus>(status, true, out var parsed))
                {
                    statusFilter = parsed;
                }

                var requests = await _withdrawalService.GetAllRequestsAsync(statusFilter);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Duyệt yêu cầu rút tiền
        /// </summary>
        [HttpPost("withdrawals/{id}/approve")]
        public async Task<IActionResult> ApproveWithdrawal(int id, [FromBody] AdminWithdrawalActionDto? dto)
        {
            try
            {
                var result = await _withdrawalService.ApproveAsync(id, dto?.AdminNote);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Từ chối yêu cầu rút tiền
        /// </summary>
        [HttpPost("withdrawals/{id}/reject")]
        public async Task<IActionResult> RejectWithdrawal(int id, [FromBody] AdminWithdrawalActionDto? dto)
        {
            try
            {
                var result = await _withdrawalService.RejectAsync(id, dto?.AdminNote);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Tổng quan doanh thu nền tảng
        /// </summary>
        [HttpGet("revenue-overview")]
        public async Task<IActionResult> GetRevenueOverview()
        {
            try
            {
                var overview = await _withdrawalService.GetRevenueOverviewAsync();
                return Ok(overview);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
