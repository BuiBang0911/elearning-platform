using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.UserLessons
{
    public interface IUserLessonService : IBaseService<UserLesson>
    {
        Task CompleteLessonAsync(int userId, int lessonId);
        Task UncompleteLessonAsync(int userId, int lessonId);

    }
}
