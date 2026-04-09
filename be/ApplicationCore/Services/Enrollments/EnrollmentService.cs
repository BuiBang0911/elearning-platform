using ApplicationCore.Data;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Enrollments
{
    public class EnrollmentService : BaseService<Enrollment>, IEnrollmentService
    {
        private readonly IRepository<Enrollment> _repository;
        public EnrollmentService(IRepository<Enrollment> repository) : base(repository) {
            _repository = repository;
        }

        public async Task EnrollAsync(int studentId, int courseId)
        {
            var existing = await _repository.FirstOrDefaultAsync(x =>
                x.UserId == studentId && x.CourseId == courseId);

            if (existing != null)
                throw new Exception("You already enroll");

            var enrollment = new Enrollment
            {
                UserId = studentId,
                CourseId = courseId,
                Status = EnrollmentStatus.Pending,
                JoinedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(enrollment);
        }

        public async Task ApproveAsync(int enrollmentId, int teacherId)
        {
            var enrollment = await _repository.FirstOrDefaultAsync(x => x.Id == enrollmentId);

            if (enrollment == null)
                throw new Exception("Not found");

            enrollment.Status = EnrollmentStatus.Approved;
            enrollment.JoinedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(enrollment);
        }

        public async Task RejectAsync(int enrollmentId, int teacherId)
        {
            var enrollment = await _repository.FirstOrDefaultAsync(x => x.Id == enrollmentId);

            if (enrollment == null)
                throw new Exception("Not found");

            enrollment.Status = EnrollmentStatus.Rejected;
            enrollment.JoinedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(enrollment);
        }

        public async Task<List<Enrollment>> GetPendingAsync(int courseId)
        {
            var res = await _repository.GetAsync(x =>
                x.CourseId == courseId &&
                x.Status == EnrollmentStatus.Pending,
                x => x.JoinedAt);

            return res.ToList();
        }

        public async Task<bool> IsApprovedAsync(int studentId, int courseId)
        {
            var enrollment = await _repository.FirstOrDefaultAsync(x =>
                x.UserId == studentId &&
                x.CourseId == courseId &&
                x.Status == EnrollmentStatus.Approved);

            return enrollment != null;
        }

    }
}
