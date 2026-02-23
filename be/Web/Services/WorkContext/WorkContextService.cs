using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Web.Services.WorkContext
{
    public class WorkContextService : IWorkContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public WorkContextService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public int? UserId
        {
            get
            {
                var id = User?.FindFirstValue(ClaimTypes.NameIdentifier);
                return id != null ? int.Parse(id) : null;
            }
        }

        public string? Email => User?.FindFirstValue(ClaimTypes.Email);

        public string? Role => User?.FindFirstValue(ClaimTypes.Role);

        public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    }
}
