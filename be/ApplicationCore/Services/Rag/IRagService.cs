namespace ApplicationCore.Services.Rag
{
    public interface IRagService
    {
        Task<bool> TriggerEmbeddingAsync(string filePath, int? lessonId = null);
    }
}
