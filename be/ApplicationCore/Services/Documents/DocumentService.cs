using ApplicationCore.Data;
using Infrastructure.Entities;
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
        public DocumentService(IRepository<Document> repository) : base(repository) { }
    }
}
