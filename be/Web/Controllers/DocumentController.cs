using ApplicationCore.Data;
using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Documents;
using ApplicationCore.Services.Lessons;
using ApplicationCore.Services.Rag;
using ApplicationCore.Services.Storage;
using AutoMapper;
using Azure.Core;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Web.Controllers
{
    public class DocumentController : BaseEntityController<Document, DocumentRequest, DocumentUpdateRequest, DocumentResponse>
    {
        private readonly IAuthService _authService;
        private readonly ICeleryService _celeryService;
        private readonly IMapper _mapper;
        private readonly IDocumentService _documentService;
        private readonly IStorageService _storageService;

        public DocumentController(IDocumentService documentService, IStorageService storageService, IAuthService authService, ICeleryService celeryService, IMapper mapper) : base(documentService, mapper)
        {
            _documentService = documentService;
            _storageService = storageService;
            _authService = authService;
            _celeryService = celeryService;
            _mapper = mapper;
        }

        [HttpPost]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public override async Task<ActionResult<DocumentResponse>> Create([FromForm] DocumentUpdateRequest request)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            if (request.File == null) return BadRequest("File not null");

            var resultUrl = await _storageService.UploadFileAsync(request.File);
            if (string.IsNullOrEmpty(resultUrl))
            {
                return BadRequest("Cannot upload file.");
            }

            var doc = new Document
            {
                LessonId = request.LessonId,
                FileName = request.FileName,
                FilePath = resultUrl,
                Size = request.File.Length,
                Status = FileStatus.Uploaded,
            };

            var res = await _documentService.AddAndReturnAsync(doc);

            // --- TRIGGER RAG EMBEDDING ---
            try
            {
                // Save a local copy for the Python RAG to process
                // Assuming the web server has access to the rag/data directory relative to the solution root
                var ragDataPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "rag", "data");
                if (!Directory.Exists(ragDataPath)) Directory.CreateDirectory(ragDataPath);

                var localFilePath = Path.Combine(ragDataPath, request.File.FileName);
                using (var stream = new FileStream(localFilePath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                var lessonIdFilter = request.LessonId;
                var documentId = res.Id;

                // Push task to Celery instead of manual Task.Run
                await _celeryService.EnqueueTaskAsync(
                    "rag.tasks.process_document_task",
                    localFilePath,
                    lessonIdFilter,
                    documentId
                );
            }
            catch (Exception ex)
            {
                // We don't want to fail the whole upload if RAG fails, but we should log it
                Console.WriteLine($"Celery Enqueue Error: {ex.Message}");
            }

            return Ok(res);
        }

        [HttpPost("get-in-instructor")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public async Task<IActionResult> getByInstructorId([FromBody]PagingRequest pagingRequest)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            var result = await _documentService.GetByInstructorIdAsync(
                userId.Value,
                pagingRequest.PageIndex,
                pagingRequest.PageSize
            );

            return Ok((object)result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var doc = await _documentService.FirstOrDefaultAsync(x => x.Id == id);
            if (doc == null) return NotFound();

            try
            {
                // Trigger cleanup in RAG system
                await _celeryService.EnqueueTaskAsync(
                    "rag.tasks.delete_document_task",
                    doc.FileName
                );
            }
            catch (Exception ex)
            {
                // Log but don't stop deletion
                Console.WriteLine($"Celery Delete Enqueue Error: {ex.Message}");
            }

            await _documentService.DeleteAsync(doc);
            return NoContent();
        }
    }
}
