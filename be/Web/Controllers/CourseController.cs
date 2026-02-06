using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Users;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Web.Controllers;
using Web.DTO;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseController : BaseEntityController<Course, CourseRequest, UserUpdateRequest, UserResponse>
    {
        private readonly ICourseService _courseService;
        private readonly IMapper _mapper;

        public CourseController(ICourseService courseService, IMapper mapper) : base(courseService, mapper)
        {
            _courseService = courseService;
        }
    }
}
