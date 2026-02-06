namespace Web.DTO
{
    public class LessonRequest : PagingRequest
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
    }

    public class LessonResponse : BaseDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
    }

    public class LessonUpdateRequest
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int LessonOrder { get; set; }
    }
}
