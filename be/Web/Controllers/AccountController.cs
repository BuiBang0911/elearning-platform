using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Cache;
using ApplicationCore.Services.Token;
using ApplicationCore.Services.Users;
using AutoMapper;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Web.DTO;

namespace Web.Controllers
{
    [ApiController]
    [Route("api")]
    public class AccountController : ControllerBase
    {
        private readonly JwtService _jwtService;
        private readonly IAuthService _authService;
        private readonly IUserService _userService;
        private readonly IMapper _mapper;
        private readonly ICacheService _cacheService;

        public AccountController(JwtService jwtService, IAuthService authService, IUserService userService, ICacheService cacheService, IMapper mapper)
        {
            _userService = userService;
            _jwtService = jwtService;
            _mapper = mapper;
            _authService = authService;
            _cacheService = cacheService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Validate error!");
            }

            var user = await _userService.FirstOrDefaultAsync(x => x.Email == request.Email);
            if (user == null)
                return Unauthorized("Sai tài khoản hoặc mật khẩu");

            var isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
            if (!isValid)
                return Unauthorized("Sai tài khoản hoặc mật khẩu");

            var accessToken = _jwtService.GenerateToken(user.Id.ToString(), user.Role.ToString(), user.Email);

            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            await _userService.UpdateAsync(user);


            return Ok(new
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            });

        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {

            foreach (var c in User.Claims)
            {
                Console.WriteLine($"{c.Type} = {c.Value}");
            }
            var userId = _authService.UserId;
            var jti = _authService.Jti;

            if (userId == null || jti == null) return BadRequest();
            var user = await _userService.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return BadRequest();
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userService.UpdateAsync(user);

            var expClaim = User.FindFirst("exp")?.Value;
            if (long.TryParse(expClaim, out long expUnix))
            {
                var expiryDate = DateTimeOffset.FromUnixTimeSeconds(expUnix);
                var timeUntilExpiry = expiryDate - DateTimeOffset.UtcNow;

                if (timeUntilExpiry > TimeSpan.Zero)
                {
                    await _cacheService.SetAsync(jti, "revoked", timeUntilExpiry);
                }
            }
            return Ok();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.FullName) ||
                request.Role == null)
            {
                return BadRequest("Validate error!");
            }

            var user = await _userService.FirstOrDefaultAsync(x => x.Email == request.Email);
            if (user != null) return BadRequest(new { message = "Email already existed!" });

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var userRequest = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Password = passwordHash,
                Role = UserRole.Student,
            };

            await _userService.AddAsync(userRequest);

            return Ok();
        }

        [Authorize(Roles = nameof(UserRole.Student))]
        [HttpPost("update-to-lecture")]
        public async Task<IActionResult> UpdateToLecture()
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();
            var user = await _userService.FirstOrDefaultAsync(x => x.Id == userId); 
            if (user == null) return BadRequest();
            user.Role = UserRole.Lecturer;
            await _userService.UpdateAsync(user);
            return Ok();
        }

        [Authorize]
        [HttpGet("get-me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = _authService.UserId;
            if (userId == null) return BadRequest();
            var user = await _userService.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return BadRequest();
            var res = _mapper.Map<UserResponse>(user);
            return Ok(res);
        }
    }
}
