using ApplicationCore.Data;
using ApplicationCore.Services.Enrollments;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.UserLessons
{
    public class UserLessonService : BaseService<UserLesson>, IUserLessonService
    {
        private readonly IRepository<UserLesson> _repository;
        private readonly IEnrollmentService _enrollmentService;
        private readonly IRepository<Lesson> _lessonRepo;
        public UserLessonService(IRepository<UserLesson> repository) : base(repository) {
            _repository = repository;
        }

        public async Task CompleteLessonAsync(int userId, int lessonId)
        {
            var lesson = await _lessonRepo.FirstOrDefaultAsync(x => x.Id == lessonId);
            if (lesson == null)
                throw new Exception("Lesson not found");

            var isApproved = await _enrollmentService
                .IsApprovedAsync(userId, lesson.CourseId);

            if (!isApproved)
                throw new UnauthorizedAccessException();

            var existing = await _repository.FirstOrDefaultAsync(x =>
                x.UserId == userId && x.LessonId == lessonId);

            if (existing != null)
            {
                if (existing.IsCompleted)
                    return; 

                existing.IsCompleted = true;
                existing.CompletedAt = DateTime.UtcNow;

                await _repository.UpdateAsync(existing);
                return;
            }

            var userLesson = new UserLesson
            {
                UserId = userId,
                LessonId = lessonId,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(userLesson);
        }

        public async Task UncompleteLessonAsync(int userId, int lessonId)
        {
            var lesson = await _lessonRepo.FirstOrDefaultAsync(x => x.Id == lessonId);
            if (lesson == null)
                throw new Exception("Lesson not found");

            var isApproved = await _enrollmentService
                .IsApprovedAsync(userId, lesson.CourseId);

            if (!isApproved)
                throw new UnauthorizedAccessException();

            var existing = await _repository.FirstOrDefaultAsync(x =>
                x.UserId == userId && x.LessonId == lessonId);

            if (existing == null)
                return; 

            existing.IsCompleted = false;
            existing.CompletedAt = null;

            await _repository.UpdateAsync(existing);
        }
    }
}
