using Microsoft.EntityFrameworkCore.Storage;
using StackExchange.Redis;
using System.Text.Json;

namespace ApplicationCore.Services.Cache
{
    public class CacheService : ICacheService
    {
        private readonly StackExchange.Redis.IDatabase _db;

        public CacheService(IConnectionMultiplexer redis)
        {
            _db = redis.GetDatabase();
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var json = JsonSerializer.Serialize(value, options);

            await _db.StringSetAsync(key, json, expiry ?? TimeSpan.MaxValue);
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            var value = await _db.StringGetAsync(key);

            if (value.IsNullOrEmpty) return default;

            return JsonSerializer.Deserialize<T>(value!);
        }

        public async Task<bool> ExistsAsync(string key)
        {
            return await _db.KeyExistsAsync(key);
        }

        public async Task RemoveAsync(string key)
        {
            await _db.KeyDeleteAsync(key);
        }
    }
}
