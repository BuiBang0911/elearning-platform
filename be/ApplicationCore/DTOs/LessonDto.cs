namespace ApplicationCore.DTO
{
    public class LessonRequest : PagingRequest
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
    }

    public class LessonResponse : BaseDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
    }

    public class LessonUpdateRequest
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
    }

    public class LessonByStudent : LessonResponse
    {
        public bool isCompleted { get; set; }
    }
}
