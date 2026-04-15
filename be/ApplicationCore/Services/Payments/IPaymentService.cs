using ApplicationCore.DTOs;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PayOS.Models.Webhooks;

namespace ApplicationCore.Services.Payments
{
    public interface IPaymentService
    {
        Task<PaymentLinkResponse> CreatePaymentLinkAsync(int studentId, int courseId);
        Task HandleWebhookAsync(Webhook webhookBody);
        Task<Order> GetOrderByCodeAsync(long orderCode);
        Task<List<OrderResponse>> GetOrdersByStudentAsync(int studentId);
    }
}
