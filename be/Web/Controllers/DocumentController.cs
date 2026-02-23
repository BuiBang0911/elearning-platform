using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Documents;
using AutoMapper;
using Infrastructure.Entities;
using Web.DTO;

namespace Web.Controllers
{
    public class DocumentController : BaseEntityController<Document, DocumentRequest, DocumentUpdateRequest, DocumentResponse>
    {
        private readonly IDocumentService _documentService;
        private readonly IMapper _mapper;

        public DocumentController(IDocumentService documentService, IMapper mapper) : base(documentService, mapper)
        {
            _documentService = documentService;
        }
    }
}
