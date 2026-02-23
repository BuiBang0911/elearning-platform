using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Auth
{
    public interface IAuthService
    {
        int? UserId { get; }
        string? Email { get; }
        string? Jti { get; }
    }
}
