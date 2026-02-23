using ApplicationCore.Data;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Lessons
{
    public class LessonService : BaseService<Lesson>, ILessonService
    {
        private readonly IRepository<Lesson> _repository;
        public LessonService(IRepository<Lesson> repository) : base(repository) { }
    }
}
