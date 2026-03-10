using ApplicationCore.Services.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private readonly IStorageService _storageService;

        public FilesController(IStorageService storageService)
        {
            _storageService = storageService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            var resultUrl = await _storageService.UploadFileAsync(file);

            if (string.IsNullOrEmpty(resultUrl))
            {
                return BadRequest("Cannot upload file.");
            }

            return Ok(new { url = resultUrl });
        }
    }
}
