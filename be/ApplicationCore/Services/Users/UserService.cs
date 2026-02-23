using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ApplicationCore.Data;
using Infrastructure.Entities;

namespace ApplicationCore.Services.Users
{
    public class UserService : BaseService<User>, IUserService
    {
        private readonly IRepository<User> _repository;
        public UserService(IRepository<User> repository) : base(repository) { }
    }
}
