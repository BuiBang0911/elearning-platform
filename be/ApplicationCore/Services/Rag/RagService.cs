using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace ApplicationCore.Services.Rag
{
    public class RagService : IRagService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RagService> _logger;
        private const string RAG_API_URL = "http://localhost:8000/api/ingest";

        public RagService(HttpClient httpClient, ILogger<RagService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<bool> TriggerEmbeddingAsync(string filePath, int? lessonId = null)
        {
            try
            {
                _logger.LogInformation($"Triggering RAG embedding for file: {filePath}, LessonId: {lessonId}");
                
                var request = new { file_path = filePath, lesson_id = lessonId };
                var response = await _httpClient.PostAsJsonAsync(RAG_API_URL, request);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation($"RAG embedding successful: {result}");
                    return true;
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"RAG embedding failed. Status: {response.StatusCode}, Error: {error}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while calling RAG API");
                return false;
            }
        }
    }
}
