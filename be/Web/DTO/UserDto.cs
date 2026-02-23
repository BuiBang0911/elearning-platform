using Infrastructure.Entities;

namespace Web.DTO
{
    public class UserRequest : PagingRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public bool IsDelete { get; set; }
        public UserRole Role { get; set; } // student | lecturer | admin
    }

    public class UserResponse : BaseDto
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public UserRole Role { get; set; }
        public bool IsDelete { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UserUpdateRequest
    {
        public string FullName { get; set; }
        public UserRole Role { get; set; }
        public bool IsDelete { get; set; }
    }
}
