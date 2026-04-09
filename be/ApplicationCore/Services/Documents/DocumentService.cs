using ApplicationCore.Data;
using ApplicationCore.DTO;
using ApplicationCore.Services.Storage;
using Infrastructure.Data;
using Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Documents
{
    public class DocumentService : BaseService<Document>, IDocumentService
    {
        private readonly IRepository<Document> _repository;
        private readonly IStorageService _storageService;
        private readonly DatabaseContext _dbContext;

        public DocumentService(IRepository<Document> repository, IStorageService storageService, DatabaseContext dbContext) : base(repository) {
            _repository = repository;
            _storageService = storageService;
            _dbContext = dbContext;
        }

        public async Task<IPagedList<DocumentResponse>> GetByInstructorIdAsync(int userId, int pageIndex, int pageSize)
        {
            var query = _repository.Table
            .Where(x => x.Lesson.Course.LecturerId == userId)
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new DocumentResponse
            {
                Id = x.Id,
                FileName = x.FileName,
                FilePath = x.FilePath,
                UploadedAt = x.UploadedAt,

                LessonId = x.LessonId,
                LessonTitle = x.Lesson.Title,

                CourseId = x.Lesson.Course.Id,
                CourseTitle = x.Lesson.Course.Title
            });

            var res = new PagedList<DocumentResponse>(query, pageIndex, pageSize, query.Count());

            return res;

        }

        public async Task<List<DocumentResponse>> SearchDocumentsInCourseAsync(int courseId, string searchTerm = null)
        {
            var query = _dbContext.Documents.Where(d => d.Lesson.CourseId == courseId);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower().Trim();
                query = query.Where(d => d.FileName.ToLower().Contains(searchTerm));
            }

            return await query
                .Select(d => new DocumentResponse
                {
                    Id = d.Id,
                    FileName = d.FileName,
                    FilePath = d.FilePath,
                    LessonTitle = d.Lesson.Title,
                    UploadedAt = d.UploadedAt,
                    Size = d.Size,
                    Status = d.Status
                })
                .ToListAsync();
        }
    }
}
