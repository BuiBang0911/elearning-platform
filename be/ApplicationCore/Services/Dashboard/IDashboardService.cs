using ApplicationCore.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Dashboard
{
    public interface IDashboardService
    {
        Task<StudentStatsDto> GetStudentDashboardStatsAsync(int studentId);
    }
}
