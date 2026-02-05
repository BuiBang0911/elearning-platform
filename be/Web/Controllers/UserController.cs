using ApplicationCore.Services;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController
    {
        /*private readonly IBaseService<User> _userService;

        public UserController(IBaseService<User> userService)
        {
            _userService = userService;
        }
        
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PaginationRequestDto paginationRequestDto)
        {
            var users = await _userService.GetAsync()
            return Ok(employees);
        }*/
    }
}
