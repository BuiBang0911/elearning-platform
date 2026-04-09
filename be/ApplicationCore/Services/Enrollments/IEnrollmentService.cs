using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Enrollments
{
    public interface IEnrollmentService : IBaseService<Enrollment>
    {
        Task EnrollAsync(int studentId, int courseId);
        Task ApproveAsync(int enrollmentId, int teacherId);
        Task RejectAsync(int enrollmentId, int teacherId);
        Task<List<Enrollment>> GetPendingAsync(int courseId);
        Task<bool> IsApprovedAsync(int studentId, int courseId);

    }
}
