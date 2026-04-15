using ApplicationCore.DTOs;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Payments;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS.Models.Webhooks;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IAuthService _authService;

        public PaymentController(IPaymentService paymentService, IAuthService authService)
        {
            _paymentService = paymentService;
            _authService = authService;
        }

        /// <summary>
        /// Tạo link thanh toán PayOS cho khóa học
        /// </summary>
        [HttpPost("create-link")]
        [Authorize(Roles = nameof(UserRole.Student))]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequest request)
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var result = await _paymentService.CreatePaymentLinkAsync(userId.Value, request.CourseId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Webhook từ PayOS - xác nhận thanh toán
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> HandleWebhook([FromBody] Webhook webhookBody)
        {
            try
            {
                await _paymentService.HandleWebhookAsync(webhookBody);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                // Log the error but still return 200 to PayOS
                Console.WriteLine($"Webhook error: {ex.Message}");
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Return URL sau khi thanh toán thành công
        /// </summary>
        [HttpGet("verify/{orderCode}")]
        [Authorize(Roles = nameof(UserRole.Student))]
        public async Task<IActionResult> VerifyPayment(long orderCode)
        {
            try
            {
                var order = await _paymentService.GetOrderByCodeAsync(orderCode);
                if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

                return Ok(new OrderResponse
                {
                    Id = order.Id,
                    CourseId = order.CourseId,
                    CourseTitle = order.Course?.Title ?? "",
                    CourseThumbnail = order.Course?.Thumbnail ?? "",
                    Amount = order.Amount,
                    Status = order.Status.ToString(),
                    CreatedAt = order.CreatedAt,
                    PaidAt = order.PaidAt
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng của học sinh
        /// </summary>
        [HttpGet("my-orders")]
        [Authorize(Roles = nameof(UserRole.Student))]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var orders = await _paymentService.GetOrdersByStudentAsync(userId.Value);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
