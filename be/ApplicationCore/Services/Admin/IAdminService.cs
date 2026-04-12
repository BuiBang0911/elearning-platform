using ApplicationCore.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Admin
{
    public interface IAdminService
    {
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
        Task<List<AdminUserListDto>> GetUsersAsync();
        Task<bool> ToggleUserStatusAsync(int userId);
        Task<List<AdminCourseListDto>> GetCoursesAsync();
        Task<bool> DeleteCourseAsync(int courseId);
    }
}
