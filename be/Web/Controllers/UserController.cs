using ApplicationCore.Services;
using ApplicationCore.Services.Users;
using Ardalis.Specification;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Web.DTO;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseEntityController<User, UserRequest, UserUpdateRequest, UserResponse>
    {
        private readonly IUserService _userService;
        private readonly IMapper _mapper;

        public UserController(IUserService userService, IMapper mapper) : base(userService, mapper) {
            _userService = userService;
        }

        [HttpDelete("{id}")]
        public override async Task<IActionResult> Delete(int id)
        {
            var entity = await _userService.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            if (entity.IsDelete == true) return BadRequest( new {message = "User is deleted ago!"});

            entity.IsDelete = true;

            await _userService.UpdateAsync(entity);
            return NoContent();
        }

        [HttpPost]
        [ApiExplorerSettings(IgnoreApi = true)]
        public override async Task<ActionResult<UserResponse>> Create([FromBody] UserUpdateRequest rq)
        {
            return await base.Create(rq);
        }

    }
}
