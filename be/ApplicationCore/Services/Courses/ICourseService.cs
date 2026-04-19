using ApplicationCore.Data;
using ApplicationCore.DTO;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Courses
{
    public interface ICourseService : IBaseService<Course>
    {
        Task<List<CourseByStudentDashboard>> CourseByStudentDashboard(int studentId, PagingRequest? pagingRequest = null, int? teacherId = null);
        Task<List<CourseForStudent>> GetCoursesForStudentAsync(int studentId);
        Task<IPagedList<CourseResponse>> GetTopRatedCoursesPagedAsync(int pageNumber = 1, int pageSize = 10);
        Task<IPagedList<CourseListDto>> GetAllCoursesForStudentAsync(int? studentId, string? searchQuery = null, int pageNumber = 1, int pageSize = 10);
        Task<CourseDetailForStudentDto?> GetCourseDetailForStudentAsync(int courseId, int? studentId);
        Task UpdateCourseRatingAsync(int courseId);
        Task<List<CourseListDto>> GetRecommendedCoursesAsync(int studentId, int top = 5);
    }
}
