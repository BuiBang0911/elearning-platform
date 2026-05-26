using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ApplicationCore.Services.Storage
{
    public class AzureStorageService : IStorageService
    {
        private readonly string _connectionString;
        private readonly string _containerName;

        public AzureStorageService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("AzureStorage");
            _containerName = configuration["AzureConfig:ContainerName"];
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;

            // Connect to Azure Storage
            var blobServiceClient = new BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            // Ensure the container exists (create it if it does not exist with private access)
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

            // Generate a unique file name to avoid overwriting existing files
            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var blobClient = containerClient.GetBlobClient(fileName);

            // Upload the file data to cloud storage
            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });
            }

            // Return the absolute URL to store in EduMind database
            return blobClient.Uri.ToString();
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            var blobServiceClient = new BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            // Lấy tên file từ URL
            Uri uri = new Uri(fileUrl);
            string fileName = Path.GetFileName(uri.LocalPath);

            var blobClient = containerClient.GetBlobClient(fileName);
            return await blobClient.DeleteIfExistsAsync();
        }

        public async Task<Stream> GetFileStreamAsync(string fileUrl)
        {
            var blobServiceClient = new BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
            
            string fileName;
            if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
            {
                fileName = Path.GetFileName(uri.LocalPath);
            }
            else
            {
                fileName = Path.GetFileName(fileUrl);
            }

            var blobClient = containerClient.GetBlobClient(fileName);

            var response = await blobClient.DownloadStreamingAsync();
            return response.Value.Content;
        }
    }
}
