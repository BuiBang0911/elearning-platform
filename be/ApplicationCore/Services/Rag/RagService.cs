using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ApplicationCore.Services.Rag
{
    public class RagService : IRagService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RagService> _logger;
        private readonly string _ragApiUrl;

        public RagService(HttpClient httpClient, ILogger<RagService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _ragApiUrl = (configuration["AIService:Url"] ?? "http://localhost:8000") + "/api/ingest";
        }

        public async Task<bool> TriggerEmbeddingAsync(string filePath, int? lessonId = null)
        {
            try
            {
                _logger.LogInformation("Triggering RAG embedding for file: {FilePath}, LessonId: {LessonId}", filePath, lessonId);
                
                var request = new { file_path = filePath, lesson_id = lessonId };
                var response = await _httpClient.PostAsJsonAsync(_ragApiUrl, request);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("RAG embedding successful: {Result}", result);
                    return true;
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("RAG embedding failed. Status: {StatusCode}, Error: {Error}", response.StatusCode, error);
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

