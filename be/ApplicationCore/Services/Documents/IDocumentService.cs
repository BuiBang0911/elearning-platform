using ApplicationCore.Data;
using ApplicationCore.DTO;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Documents
{
    public interface IDocumentService : IBaseService<Document>
    {
        Task<IPagedList<DocumentResponse>> GetByInstructorIdAsync(int userId, int pageIndex, int pageSize);
        Task<List<DocumentResponse>> SearchDocumentsInCourseAsync(int courseId, string searchTerm = null);
    }
}
