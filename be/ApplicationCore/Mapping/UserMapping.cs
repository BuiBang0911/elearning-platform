using ApplicationCore.DTO;
using ApplicationCore.Mapping;
using AutoMapper;
using Infrastructure.Entities;

namespace Web.Mapping
{
    public class UserMapping : BaseMapping<User, UserRequest, UserUpdateRequest, UserResponse>
    {
        public UserMapping()
        {
        }

    }
}
