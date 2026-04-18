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
using Microsoft.AspNetCore.RateLimiting;
using System;
using System.IO;
using System.Linq;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentController : BaseEntityController<Document, DocumentRequest, DocumentUpdateRequest, DocumentResponse>
    {
        private readonly IAuthService _authService;
        private readonly ICeleryService _celeryService;
        private readonly IMapper _mapper;
        private readonly IDocumentService _documentService;
        private readonly ILessonService _lessonService;
        private readonly IStorageService _storageService;

        public DocumentController(IDocumentService documentService, ILessonService lessonService, IStorageService storageService, IAuthService authService, ICeleryService celeryService, IMapper mapper) : base(documentService, mapper)
        {
            _documentService = documentService;
            _lessonService = lessonService;
            _storageService = storageService;
            _authService = authService;
            _celeryService = celeryService;
            _mapper = mapper;
        }

        [HttpPost]
        [Authorize(Roles = $"{nameof(UserRole.Instructor)}")]
        [EnableRateLimiting("UploadPolicy")]
        public override async Task<ActionResult<DocumentResponse>> Create([FromForm] DocumentUpdateRequest request)
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized("Invalid refresh token");

            // Verify if lesson belongs to a course owned by the instructor
            var lesson = await _lessonService.FirstOrDefaultAsync(l => l.Id == request.LessonId, earlyLoad: [x => x.Course]);
            if (lesson == null) return NotFound("Lesson not found");
            if (lesson.Course.LecturerId != userId) return Forbid("You do not have permission to add documents to this lesson.");

            if (request.File == null) return BadRequest("File is required");

            // 1. Validate File Size (Max 5MB)
            const long maxFileSize = 5 * 1024 * 1024;
            if (request.File.Length > maxFileSize)
            {
                return BadRequest("File size exceeds 5MB limit.");
            }

            // 2. Validate File Extension
            var allowedExtensions = new[] { ".pdf" };
            var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest("Only .pdf files are allowed for documents.");
            }

            // 3. Validate Content Type
            if (request.File.ContentType != "application/pdf")
            {
                return BadRequest("Invalid file content type. Expected application/pdf.");
            }

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
                var lessonIdFilter = request.LessonId;
                var documentId = res.Id;

                // Pass the Cloud URL (resultUrl) directly to RAG
                await _celeryService.EnqueueTaskAsync(
                    "rag.tasks.process_document_task",
                    resultUrl,
                    lessonIdFilter,
                    documentId
                );
            }
            catch (Exception ex)
            {
                // We don't want to fail the whole upload if RAG fails, but we should log it
                Console.WriteLine($"Celery Enqueue Error: {ex.Message}");
            }

            var response = _mapper.Map<DocumentResponse>(res);
            return Ok(response);
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
            var doc = await _documentService.FirstOrDefaultAsync(x => x.Id == id, earlyLoad: [x => x.Lesson.Course]);
            if (doc == null) return NotFound();

            var userId = _authService.UserId;
            if (doc.Lesson.Course.LecturerId != userId && !User.IsInRole(nameof(UserRole.Admin)))
                return Forbid("You do not have permission to delete this document.");

            // 1. Delete actual file from cloud storage
            try
            {
                if (!string.IsNullOrEmpty(doc.FilePath))
                {
                    await _storageService.DeleteFileAsync(doc.FilePath);
                    Console.WriteLine($"✅ Physical file deleted from storage: {doc.FilePath}");
                }
            }
            catch (Exception ex)
            {
                // We log the storage error but continue with database deletion
                // to avoid keeping "dead" records in the UI.
                Console.WriteLine($"⚠️ Storage Delete Error: {ex.Message}");
            }

            // 2. Trigger cleanup in RAG system using the unique blob name
            try
            {
                // Extract unique filename (GUID-based) from storage URL
                Uri uri = new Uri(doc.FilePath);
                string physicalFileName = Path.GetFileName(uri.LocalPath);

                await _celeryService.EnqueueTaskAsync(
                    "rag.tasks.delete_document_task",
                    physicalFileName
                );
                Console.WriteLine($"🚀 Enqueued RAG cleanup for: {physicalFileName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Celery Delete Enqueue Error: {ex.Message}");
            }

            // 3. Delete from database
            await _documentService.DeleteAsync(doc);
            return NoContent();
        }
    }
}
