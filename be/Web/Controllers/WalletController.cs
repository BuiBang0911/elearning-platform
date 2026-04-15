using ApplicationCore.DTOs;
using ApplicationCore.Services.Auth;
using ApplicationCore.Services.Wallets;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = nameof(UserRole.Instructor))]
    public class WalletController : ControllerBase
    {
        private readonly ITeacherWalletService _walletService;
        private readonly IAuthService _authService;

        public WalletController(ITeacherWalletService walletService, IAuthService authService)
        {
            _walletService = walletService;
            _authService = authService;
        }

        /// <summary>
        /// Lấy số dư ví giáo viên
        /// </summary>
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var wallet = await _walletService.GetOrCreateWalletAsync(userId.Value);
                return Ok(new { balance = wallet.Balance, totalEarned = wallet.TotalEarned });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê doanh thu giáo viên
        /// </summary>
        [HttpGet("revenue-stats")]
        public async Task<IActionResult> GetRevenueStats()
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var stats = await _walletService.GetRevenueStatsAsync(userId.Value);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy lịch sử giao dịch ví
        /// </summary>
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var transactions = await _walletService.GetTransactionsAsync(userId.Value);
                return Ok(transactions.Select(t => new
                {
                    t.Id,
                    t.Amount,
                    Type = t.Type.ToString(),
                    t.Description,
                    t.CreatedAt
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Yêu cầu rút tiền
        /// </summary>
        [HttpPost("withdraw")]
        public async Task<IActionResult> RequestWithdrawal([FromBody] WithdrawalRequestDto request)
        {
            try
            {
                var userId = _authService.UserId;
                if (userId == null) return Unauthorized();

                var withdrawal = await _walletService.RequestWithdrawalAsync(userId.Value, request);
                return Ok(new
                {
                    message = "Yêu cầu rút tiền đã được gửi thành công.",
                    withdrawal = new
                    {
                        withdrawal.Id,
                        withdrawal.Amount,
                        Status = withdrawal.Status.ToString(),
                        withdrawal.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
