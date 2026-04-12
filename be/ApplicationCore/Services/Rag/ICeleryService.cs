using System.Threading.Tasks;

namespace ApplicationCore.Services.Rag
{
    public interface ICeleryService
    {
        /// <summary>
        /// Gửi một task vào queue Celery qua Redis
        /// </summary>
        /// <param name="taskName">Tên task (ví dụ: rag.tasks.process_document_task)</param>
        /// <param name="args">Danh sách tham số của task</param>
        /// <returns></returns>
        Task EnqueueTaskAsync(string taskName, params object[] args);
    }
}
