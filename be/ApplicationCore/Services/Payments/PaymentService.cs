using ApplicationCore.Data;
using ApplicationCore.DTOs;
using ApplicationCore.Services.Enrollments;
using ApplicationCore.Services.Wallets;
using Infrastructure.Entities;
using Microsoft.Extensions.Configuration;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Payments
{
    public class PaymentService : IPaymentService
    {
        private readonly IRepository<Order> _orderRepository;
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<Enrollment> _enrollmentRepository;
        private readonly ITeacherWalletService _walletService;
        private readonly PayOSClient _payOS;
        private readonly IConfiguration _configuration;

        public PaymentService(
            IRepository<Order> orderRepository,
            IRepository<Course> courseRepository,
            IRepository<Enrollment> enrollmentRepository,
            ITeacherWalletService walletService,
            PayOSClient payOS,
            IConfiguration configuration)
        {
            _orderRepository = orderRepository;
            _courseRepository = courseRepository;
            _enrollmentRepository = enrollmentRepository;
            _walletService = walletService;
            _payOS = payOS;
            _configuration = configuration;
        }

        public async Task<PaymentLinkResponse> CreatePaymentLinkAsync(int studentId, int courseId)
        {
            var course = await _courseRepository.FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null)
                throw new Exception("Course is not found.");

            if (course.Price <= 0)
                throw new Exception("Course is free.");

            // Check if student already enrolled
            var existingEnrollment = await _enrollmentRepository.FirstOrDefaultAsync(
                e => e.UserId == studentId && e.CourseId == courseId && e.Status == EnrollmentStatus.Approved);
            if (existingEnrollment != null)
                throw new Exception("You enrolled.");

            // Check for existing pending order
            var existingOrder = await _orderRepository.FirstOrDefaultAsync(
                o => o.StudentId == studentId && o.CourseId == courseId && o.Status == OrderStatus.Pending);
            if (existingOrder != null)
            {
                return new PaymentLinkResponse
                {
                    OrderCode = existingOrder.OrderCode,
                    CheckoutUrl = existingOrder.CheckoutUrl ?? "",
                    QrCode = ""
                };
            }

            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var returnUrl = _configuration["PayOS:ReturnUrl"] ?? "http://localhost:5173/payment/success";
            var cancelUrl = _configuration["PayOS:CancelUrl"] ?? "http://localhost:5173/payment/cancel";

            // Use PaymentLinkItem for version 2 SDK
            var items = new List<PaymentLinkItem>
            {
                new PaymentLinkItem
                {
                    Name = course.Title,
                    Quantity = 1,
                    Price = (int)course.Price
                }
            };

            // Use CreatePaymentLinkRequest for version 2 SDK
            var paymentRequest = new CreatePaymentLinkRequest
            {
                OrderCode = orderCode,
                Amount = (int)course.Price,
                Description = $"Mua kh: {(course.Title.Length > 15 ? course.Title.Substring(0, 15) : course.Title)}",
                Items = items,
                CancelUrl = cancelUrl,
                ReturnUrl = returnUrl
            };

            CreatePaymentLinkResponse paymentResult = await _payOS.PaymentRequests.CreateAsync(paymentRequest);

            var order = new Order
            {
                CourseId = courseId,
                StudentId = studentId,
                OrderCode = orderCode,
                Amount = course.Price,
                Status = OrderStatus.Pending,
                PaymentLinkId = paymentResult.PaymentLinkId,
                CheckoutUrl = paymentResult.CheckoutUrl
            };

            await _orderRepository.AddAsync(order);

            return new PaymentLinkResponse
            {
                OrderCode = orderCode,
                CheckoutUrl = paymentResult.CheckoutUrl,
                QrCode = paymentResult.QrCode
            };
        }

        public async Task HandleWebhookAsync(Webhook webhookBody)
        {
            WebhookData verifiedData = await _payOS.Webhooks.VerifyAsync(webhookBody);

            if (verifiedData.OrderCode == 123)
                return;

            var order = await _orderRepository.FirstOrDefaultAsync(
                o => o.OrderCode == verifiedData.OrderCode,
                o => o.Course);

            if (order == null)
                throw new Exception($"Không tìm thấy đơn hàng với mã: {verifiedData.OrderCode}");

            if (order.Status == OrderStatus.Completed)
                return;

            // In v2, check Code property or Status
            // Success code is "00"
            if (verifiedData.Code == "00") 
            {
                order.Status = OrderStatus.Completed;
                order.PaidAt = DateTime.UtcNow;
                await _orderRepository.UpdateAsync(order);

                var existingEnrollment = await _enrollmentRepository.FirstOrDefaultAsync(
                    e => e.UserId == order.StudentId && e.CourseId == order.CourseId);

                if (existingEnrollment == null)
                {
                    var enrollment = new Enrollment
                    {
                        UserId = order.StudentId,
                        CourseId = order.CourseId,
                        Status = EnrollmentStatus.Approved,
                        JoinedAt = DateTime.UtcNow
                    };
                    await _enrollmentRepository.AddAsync(enrollment);
                }
                else if (existingEnrollment.Status != EnrollmentStatus.Approved)
                {
                    existingEnrollment.Status = EnrollmentStatus.Approved;
                    await _enrollmentRepository.UpdateAsync(existingEnrollment);
                }

                if (order.Course?.LecturerId != null)
                {
                    var teacherSharePercent = _configuration.GetValue<int>("Revenue:TeacherSharePercent", 70);
                    var teacherShare = order.Amount * teacherSharePercent / 100;

                    await _walletService.AddRevenueAsync(
                        order.Course.LecturerId.Value,
                        teacherShare,
                        order.Id,
                        $"Doanh thu khóa học: {order.Course.Title}"
                    );
                }
            }
            else
            {
                order.Status = OrderStatus.Cancelled;
                await _orderRepository.UpdateAsync(order);
            }
        }

        public async Task<Order> GetOrderByCodeAsync(long orderCode)
        {
            return await _orderRepository.FirstOrDefaultAsync(o => o.OrderCode == orderCode, o => o.Course);
        }

        public async Task<List<OrderResponse>> GetOrdersByStudentAsync(int studentId)
        {
            var orders = await _orderRepository.GetAsync<DateTime>(
                where: o => o.StudentId == studentId,
                orderBy: o => o.CreatedAt,
                ascending: false,
                relatedEntities: new System.Linq.Expressions.Expression<Func<Order, object>>[] { o => o.Course }
            );

            return orders.Select(o => new OrderResponse
            {
                Id = o.Id,
                CourseId = o.CourseId,
                CourseTitle = o.Course?.Title ?? "",
                CourseThumbnail = o.Course?.Thumbnail ?? "",
                Amount = o.Amount,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt,
                PaidAt = o.PaidAt
            }).ToList();
        }
    }
}
