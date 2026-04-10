using ApplicationCore.Data;
using ApplicationCore.DTO;
using AutoMapper;
using Infrastructure.Data;
using Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Courses
{
    public class CourseService : BaseService<Course>, ICourseService
    {
        private readonly IRepository<Course> _repository;
        private readonly IRepository<UserLesson> _userLessonRepository;
        private readonly DatabaseContext _context;
        private readonly IMapper _mapper;

        public CourseService(IRepository<Course> repository, IRepository<UserLesson> userLessonRepository, IMapper mapper, DatabaseContext context) : base(repository)
        {
            _repository = repository;
            _userLessonRepository = userLessonRepository;
            _context = context; 
            _mapper = mapper;
        }

        public async Task<List<CourseByStudentDashboard>> CourseByStudentDashboard(int studentId, PagingRequest? pagingRequest = null, int? teacherId = null)
        {
            var completedLessonIds = (await _userLessonRepository.GetAsync(
                x => x.UserId == studentId && x.IsCompleted,
                orderBy: x => x.LessonId
            )).Select(x => x.LessonId).ToHashSet();

            var courses = await _repository.GetPagedListAsync(
                where: x => x.Enrollments.Any(e => e.UserId == studentId)
                            && (!teacherId.HasValue || x.LecturerId == teacherId),
                orderBy: x => x.CreatedAt,
                page: pagingRequest?.PageIndex ?? 0,
                count: pagingRequest?.PageSize ?? int.MaxValue,
                relatedEntities: new Expression<Func<Course, object>>[]
                {
                    x => x.Enrollments,
                    x => x.Lessons
                }
            );

            var result = courses.Items.Select(c => new CourseByStudentDashboard
            {
                Id = c.Id,
                Title = c.Title,

                JoinAt = c.Enrollments.FirstOrDefault(e => e.UserId == studentId)?.JoinedAt ?? DateTime.MinValue,

                Lessons = c.Lessons
                .OrderBy(l => l.LessonOrder)
                .Select(l => new LessonByStudent
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    LessonOrder = l.LessonOrder,
                    Description = l.Description,
                    Content = l.Content,

                    isCompleted = completedLessonIds.Contains(l.Id)
                }).ToList()


            }).ToList();

            return result;
        }

        public async Task<List<CourseForStudent>> GetCoursesForStudentAsync(int studentId)
        {
            var courses = await _context.Enrollments
                .Where(e => e.UserId == studentId)
                .Select(e => new CourseForStudent
                {
                    Id = e.Course.Id,
                    Title = e.Course.Title,
                    Description = e.Course.Description,
                    InstructorName = _context.Users
                        .Where(u => u.Id == e.Course.LecturerId)
                        .Select(u => u.FullName)
                        .FirstOrDefault(),
                    CreatedAt = e.Course.CreatedAt,
                    Thumbnail = e.Course.Thumbnail,
                    Level = e.Course.Level,
                    Rating = e.Course.Rating,
                    CategoryName = e.Course.Category.Name,

                    Progress = e.Course.Lessons.Any()
                        ? (double)_context.UserLessons
                            .Count(ul => ul.UserId == studentId &&
                                         ul.IsCompleted &&
                                         e.Course.Lessons.Select(l => l.Id).Contains(ul.LessonId))
                          / e.Course.Lessons.Count * 100
                        : 0
                })
                .ToListAsync();

            return courses;
        }

        public async Task<IPagedList<CourseResponse>> GetTopRatedCoursesPagedAsync(int pageNumber = 1, int pageSize = 10)
        {
            if (pageNumber < 1) pageNumber = 1;

            var query = _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Lecturer) 
                .OrderByDescending(c => c.Rating)
                .ThenByDescending(c => c.CreatedAt);

            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var mappedItems = _mapper.Map<List<CourseResponse>>(items);

            return new PagedList<CourseResponse>(mappedItems, totalCount, pageNumber, pageSize);
        }

        public async Task<IPagedList<CourseListDto>> GetAllCoursesForStudentAsync(
            int? studentId,
            string? searchQuery = null,
            int pageNumber = 1,
            int pageSize = 10)
        {
            var query = _context.Courses.AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                string pattern = $"%{searchQuery}%";
                query = query.Where(c => EF.Functions.ILike(c.Title, pattern)
                                      || EF.Functions.ILike(c.Description, pattern)
                                      || EF.Functions.ILike(c.Category.Name, pattern));
            }

            int totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CourseListDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    LectureName = _context.Users
                        .Where(u => u.Id == c.LecturerId)
                        .Select(u => u.FullName)
                        .FirstOrDefault(),
                    CreatedAt = c.CreatedAt,
                    Thumbnail = c.Thumbnail,
                    Level = c.Level,
                    Rating = c.Rating,
                    CategoryName = c.Category.Name,
                    TotalStudents = _context.Enrollments.Count(e => e.CourseId == c.Id),
                    IsEnrolled = studentId.HasValue && _context.Enrollments
                        .Any(e => e.CourseId == c.Id && e.UserId == studentId.Value),
                    Progress = (studentId.HasValue && c.Lessons.Any())
                        ? (double)_context.UserLessons.Count(ul => ul.UserId == studentId.Value && ul.IsCompleted && c.Lessons.Select(l => l.Id).Contains(ul.LessonId))
                          / c.Lessons.Count * 100 : 0
                })
                .Skip((pageNumber) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedList<CourseListDto>(items, totalCount, pageNumber, pageSize);
        }

        public async Task<CourseDetailForStudentDto?> GetCourseDetailForStudentAsync(int courseId, int? studentId)
        {
            var course = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Lecturer)
                .Include(c => c.Lessons.OrderBy(l => l.LessonOrder))
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null) return null;

            bool isEnrolled = false;
            double progress = 0;
            var completedLessonIds = new HashSet<int>();

            if (studentId.HasValue)
            {
                isEnrolled = await _context.Enrollments.AnyAsync(e => e.CourseId == courseId && e.UserId == studentId.Value);
                if (isEnrolled && course.Lessons.Any())
                {
                    completedLessonIds = (await _context.UserLessons
                        .Where(ul => ul.UserId == studentId.Value && course.Lessons.Select(l => l.Id).Contains(ul.LessonId) && ul.IsCompleted)
                        .Select(ul => ul.LessonId)
                        .ToListAsync()).ToHashSet();

                    progress = (double)completedLessonIds.Count / course.Lessons.Count * 100;
                }
            }

            var totalStudents = await _context.Enrollments.CountAsync(e => e.CourseId == courseId);

            var result = new CourseDetailForStudentDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                LecturerId = course.LecturerId,
                LectureName = course.Lecturer?.FullName,
                CreatedAt = course.CreatedAt,
                Thumbnail = course.Thumbnail,
                Level = course.Level,
                Rating = course.Rating,
                CategoryName = course.Category?.Name,
                IsEnrolled = isEnrolled,
                Progress = progress,
                TotalStudents = totalStudents,
                Lessons = course.Lessons.Select(l => new LessonByStudent
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    LessonOrder = l.LessonOrder,
                    Description = l.Description,
                    Content = l.Content,
                    isCompleted = completedLessonIds.Contains(l.Id)
                }).ToList()
            };

            return result;
        }

        public async Task UpdateCourseRatingAsync(int courseId)
        {
            var ratings = await _context.Enrollments
                .Where(e => e.CourseId == courseId && e.rating > 0)
                .Select(e => e.rating)
                .ToListAsync();

            if (ratings.Any())
            {
                var averageRating = ratings.Average();
                var course = await _repository.FirstOrDefaultAsync(c => c.Id == courseId);
                if (course != null)
                {
                    course.Rating = Math.Round(averageRating, 1);
                    await _repository.UpdateAsync(course);
                }
            }
        }
    }
}
