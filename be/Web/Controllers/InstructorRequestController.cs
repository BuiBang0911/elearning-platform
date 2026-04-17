using ApplicationCore.DTO;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.InstructorRequests;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InstructorRequestController : ControllerBase
    {
        private readonly IInstructorRequestService _requestService;
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;

        public InstructorRequestController(IInstructorRequestService requestService, IAuthService authService, IMapper mapper)
        {
            _requestService = requestService;
            _authService = authService;
            _mapper = mapper;
        }

        [HttpPost("apply")]
        [Authorize(Roles = nameof(UserRole.Student))]
        public async Task<IActionResult> Apply([FromBody] InstructorApplyRequest request)
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var result = await _requestService.ApplyAsync(userId.Value, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-status")]
        public async Task<IActionResult> GetMyStatus()
        {
            var userId = _authService.UserId;
            if (userId == null) return Unauthorized();

            var request = await _requestService.FirstOrDefaultAsync(x => x.UserId == userId.Value);
            if (request == null) return NotFound();

            return Ok(new
            {
                Status = request.Status.ToString(),
                AdminNote = request.AdminNote,
                CreatedAt = request.CreatedAt,
                ProcessedAt = request.ProcessedAt
            });
        }

        [HttpGet("admin/pending")]
        [Authorize(Roles = nameof(UserRole.Admin))]
        public async Task<IActionResult> GetPendingRequests()
        {
            try
            {
                var requests = await _requestService.GetPendingRequestsAsync();
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("admin/{id}/process")]
        [Authorize(Roles = nameof(UserRole.Admin))]
        public async Task<IActionResult> ProcessRequest(int id, [FromBody] ProcessRequestDto request)
        {
            try
            {
                var result = await _requestService.ProcessRequestAsync(id, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
