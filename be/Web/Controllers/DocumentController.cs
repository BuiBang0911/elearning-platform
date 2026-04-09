using ApplicationCore.Data;
using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Documents;
using ApplicationCore.Services.Lessons;
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
        private readonly IDocumentService _documentService;
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;
        private readonly IStorageService _storageService;
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;

        public DocumentController(IDocumentService documentService, IStorageService storageService, IAuthService authService, IMapper mapper) : base(documentService, mapper)
        {
            _documentService = documentService;
            _storageService = storageService;
            _authService = authService;
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
                Status = request.Status,
            };

            var res = await _documentService.AddAndReturnAsync(doc);

            var documentResponse = new DocumentResponse
            {
                Id = res.Id,
                LessonId = res.LessonId,
                FileName = res.FileName,
                FilePath = res.FilePath,
                UploadedAt = res.UploadedAt,
            };


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
    }
}
