using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Rag
{
    public class CeleryService : ICeleryService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly string _queueName = "celery";

        public CeleryService(IConnectionMultiplexer redis)
        {
            _redis = redis;
        }

        public async Task EnqueueTaskAsync(string taskName, params object[] args)
        {
            var db = _redis.GetDatabase();
            var taskId = Guid.NewGuid().ToString();

            // 1. TẠO BODY CHUẨN 100% BẰNG CÁCH NỐI CHUỖI (Không cho C# tự serialize mảng)
            string taskArgsJson = JsonSerializer.Serialize(args ?? new object[0]);
            string bodyJson = $"[{taskArgsJson}, {{}}, {{\"callbacks\": null, \"errbacks\": null, \"chain\": null, \"chord\": null}}]";

            string bodyBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(bodyJson));

            // 2. DÙNG DICTIONARY CHO TOÀN BỘ CÁC LỚP (Tuyệt đối không dùng "new { }")
            var message = new Dictionary<string, object>
    {
        { "body", bodyBase64 },
        { "content-type", "application/json" },
        { "content-encoding", "utf-8" },
        { "headers", new Dictionary<string, object>
            {
                { "task", taskName },
                { "id", taskId },
                { "root_id", taskId },
                { "parent_id", null },
                { "group", null },
                { "meth", null },
                { "shadow", null },
                { "eta", null },
                { "expires", null },
                { "retries", 0 },
                { "timelimit", new object[] { null, null } },
                { "lang", "py" },
                { "argsrepr", taskArgsJson },
                { "kwargsrepr", "{}" }
            }
        },
        { "properties", new Dictionary<string, object>
            {
                { "correlation_id", taskId },
                { "reply_to", taskId },
                { "delivery_mode", 2 },
                { "delivery_info", new Dictionary<string, object>
                    {
                        { "exchange", "" },
                        { "routing_key", _queueName }
                    }
                },
                { "priority", 0 },
                { "body_encoding", "base64" },
                { "delivery_tag", Guid.NewGuid().ToString() } // Chìa khóa sinh tử
            }
        }
    };

            string celeryMessage = JsonSerializer.Serialize(message);

            // 3. Push vào Redis List
            await db.ListRightPushAsync(_queueName, celeryMessage);
        }
    }
}
