using ApplicationCore.Data;
using ApplicationCore.DTO;
using ApplicationCore.Services.Cache;
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
        private readonly ICacheService _cacheService;

        public CourseService(IRepository<Course> repository, IRepository<UserLesson> userLessonRepository, IMapper mapper, DatabaseContext context, ICacheService cacheService) : base(repository)
        {
            _repository = repository;
            _userLessonRepository = userLessonRepository;
            _context = context; 
            _mapper = mapper;
            _cacheService = cacheService;
        }

        public async Task<List<CourseByStudentDashboard>> CourseByStudentDashboard(int studentId, PagingRequest? pagingRequest = null, int? teacherId = null)
        {
            var completedLessonIds = (await _userLessonRepository.GetAsync(
                x => x.UserId == studentId && x.IsCompleted,
                orderBy: x => x.LessonId
            )).Select(x => x.LessonId).ToHashSet();

            var query = _context.Courses
                .Include(x => x.Enrollments)
                .Include(x => x.Lessons)
                    .ThenInclude(l => l.Documents)
                .Where(x => x.Enrollments.Any(e => e.UserId == studentId)
                            && (!teacherId.HasValue || x.LecturerId == teacherId))
                .OrderBy(x => x.CreatedAt);

            int page = pagingRequest?.PageIndex ?? 0;
            int count = pagingRequest?.PageSize ?? int.MaxValue;

            var courses = await query
                .Skip(page * count)
                .Take(count)
                .ToListAsync();

            var result = courses.Select(c => new CourseByStudentDashboard
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

                    isCompleted = completedLessonIds.Contains(l.Id),
                    Documents = (l.Documents ?? new List<Document>()).Select(d => new DocumentResponse
                    {
                        Id = d.Id,
                        LessonId = d.LessonId,
                        FileName = d.FileName,
                        FilePath = d.FilePath,
                        Size = d.Size,
                        Status = d.Status,
                        UploadedAt = d.UploadedAt
                    }).ToList()
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
                    Rating = e.rating,
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
            var cacheKey = $"courses:top-rated:p{pageNumber}:s{pageSize}";

            var cached = await _cacheService.GetAsync<PagedList<CourseResponse>>(cacheKey);
            if (cached != null) return cached;

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
            var result = new PagedList<CourseResponse>(mappedItems, totalCount, pageNumber, pageSize);

            await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));

            return result;
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
                    Price = c.Price,
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
                    .ThenInclude(l => l.Documents)
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
                Price = course.Price,
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
                    VideoUrl = isEnrolled ? l.VideoUrl : null,
                    isCompleted = completedLessonIds.Contains(l.Id),
                    Documents = l.Documents.Select(d => new DocumentResponse
                    {
                        Id = d.Id,
                        LessonId = d.LessonId,
                        FileName = d.FileName,
                        FilePath = isEnrolled ? d.FilePath : null,
                        Size = d.Size,
                        Status = d.Status,
                        UploadedAt = d.UploadedAt
                    }).ToList()
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

        public async Task<List<CourseListDto>> GetRecommendedCoursesAsync(int studentId, int top = 5)
        {
            var cacheKey = $"recommend:u{studentId}:t{top}";
            var cached = await _cacheService.GetAsync<List<CourseListDto>>(cacheKey);
            if (cached != null) return cached;

            var enrolledCourseIds = await _context.Enrollments
                .Where(e => e.UserId == studentId)
                .Select(e => e.CourseId)
                .ToListAsync();

            var userPreferences = await _context.Enrollments
                .Where(e => e.UserId == studentId)
                .Include(e => e.Course)
                .Select(e => new { e.Course.CategoryId, e.Course.Level, e.Course.LecturerId })
                .ToListAsync();

            var favoriteCategories = userPreferences.GroupBy(x => x.CategoryId).OrderByDescending(g => g.Count()).Select(g => g.Key).Take(2).ToList();
            var favoriteLevel = userPreferences.GroupBy(x => x.Level).OrderByDescending(g => g.Count()).Select(g => g.Key).FirstOrDefault();
            var favoriteLecturers = userPreferences.GroupBy(x => x.LecturerId).Select(g => g.Key).ToHashSet();

            var potentialCourses = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.Lecturer)
                .Where(c => !enrolledCourseIds.Contains(c.Id))
                .ToListAsync();

            var potentialCourseIds = potentialCourses.Select(c => c.Id).ToList();
            var enrollmentCounts = await _context.Enrollments
                .Where(e => potentialCourseIds.Contains(e.CourseId))
                .GroupBy(e => e.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            // 4. Tính điểm
            var recommended = potentialCourses.Select(c => {
                var count = enrollmentCounts.GetValueOrDefault(c.Id, 0);
                return new
                {
                    Course = c,
                    Score = (favoriteCategories.Contains(c.CategoryId) ? 10 : 0) +
                            (c.Level == favoriteLevel ? 5 : 0) +
                            (favoriteLecturers.Contains(c.LecturerId) ? 3 : 0) +
                            (c.Rating * 2) +
                            (count * 0.1) // Không còn N+1
                };
            })
            .OrderByDescending(x => x.Score)
            .Take(top)
            .Select(x => new CourseListDto
            {
                Id = x.Course.Id,
                Title = x.Course.Title,
                Description = x.Course.Description,
                LectureName = x.Course.Lecturer?.FullName,
                CreatedAt = x.Course.CreatedAt,
                Thumbnail = x.Course.Thumbnail,
                Level = x.Course.Level,
                Rating = x.Course.Rating,
                Price = x.Course.Price,
                CategoryName = x.Course.Category?.Name,
                TotalStudents = enrollmentCounts.GetValueOrDefault(x.Course.Id, 0), // Không còn N+1
                IsEnrolled = false,
                Progress = 0
            })
            .ToList();

            // Cache kết quả trong 1 giờ
            await _cacheService.SetAsync(cacheKey, recommended, TimeSpan.FromHours(1));

            return recommended;
        }
    }
}
