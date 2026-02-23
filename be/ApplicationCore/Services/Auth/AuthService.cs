using Infrastructure.Entities;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;

namespace ApplicationCore.Services.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? UserId
        {
            get
            {
                var userIdString = _httpContextAccessor.HttpContext?
                    .User?
                    .FindFirst(ClaimTypes.NameIdentifier)?
                    .Value;

                if (int.TryParse(userIdString, out var userId))
                    return userId;

                return null;
            }
        }


        public string? Email =>
            _httpContextAccessor.HttpContext?.User?
            .FindFirst(ClaimTypes.Email)?
            .Value;

        public string? Jti =>
            _httpContextAccessor.HttpContext?.User?
            .FindFirst(JwtRegisteredClaimNames.Jti)?
            .Value;

    }
}