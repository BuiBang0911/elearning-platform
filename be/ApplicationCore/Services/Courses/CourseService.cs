using ApplicationCore.Data;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Courses
{
    public class CourseService : BaseService<Course>, ICourseService
    {
        private readonly IRepository<Course> _Repository;

        public CourseService(IRepository<Course> repository) : base(repository) { }
    }
}
