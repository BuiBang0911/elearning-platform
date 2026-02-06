using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Documents;
using ApplicationCore.Services.Lessons;
using ApplicationCore.Services.Users;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Web.Controllers;
using Web.DTO;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseController : BaseEntityController<Course, CourseRequest, CourseUpdateRequest, CourseResponse>
    {
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;
        private readonly IDocumentService _documentService;
        private readonly IMapper _mapper;

        public CourseController(ICourseService courseService, ILessonService lessonService, IDocumentService documentService, IMapper mapper) : base(courseService, mapper)
        {
            _courseService = courseService;
            _lessonService = lessonService;
            _documentService = documentService;
        }

        [HttpDelete("{id}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var entity = await _courseService.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            var liLesson = await _lessonService.GetAsync(x => x.CourseId == id);

            foreach (var lesson in liLesson) {
                var liDocument = await _documentService.GetAsync(x => x.LessonId == id);
                foreach (var document in liDocument) { 
                    await _documentService.DeleteAsync(document);
                }
                await _lessonService.DeleteAsync(lesson);
            }

            await _courseService.DeleteAsync(entity);
            return NoContent();
        }
    }
}
