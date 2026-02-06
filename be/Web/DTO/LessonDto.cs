namespace Web.DTO
{
    public class LessonRequest
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
}
