namespace Web.DTO
{
    public class QueryRequest
    {
        public string Question { get; set; }
    }

    public class QueryResponse
    {
        public string Answer { get; set; }
        public List<string> Sources { get; set; }
    }
}
