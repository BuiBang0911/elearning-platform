namespace Web.DTO
{
    public class CourseRequest : PagingRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; } 
    }

    public class CourseResponse : BaseDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CourseUpdateRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public int? LecturerId { get; set; }
    }
}
