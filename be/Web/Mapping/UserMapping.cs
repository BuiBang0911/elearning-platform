using AutoMapper;
using Infrastructure.Entities;
using Web.DTO;

namespace Web.Mapping
{
    public class UserMapping : BaseMapping<User, UserRequest, UserUpdateRequest, UserResponse>
    {
        public UserMapping()
        {
        }

    }
}
