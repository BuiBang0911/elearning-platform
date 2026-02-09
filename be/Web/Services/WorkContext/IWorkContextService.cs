using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Web.Services.WorkContext
{
    public interface IWorkContextService
    {
        int? UserId { get; }
        string? Role { get; }
        bool IsAuthenticated { get; }
    }
}
