using ApplicationCore.Data;
using ApplicationCore.DTOs;
using Infrastructure.Entities;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Withdrawals
{
    public class WithdrawalService : IWithdrawalService
    {
        private readonly IRepository<WithdrawalRequest> _withdrawalRepository;
        private readonly IRepository<TeacherWallet> _walletRepository;
        private readonly IRepository<WalletTransaction> _transactionRepository;
        private readonly IRepository<Order> _orderRepository;
        private readonly IConfiguration _configuration;

        public WithdrawalService(
            IRepository<WithdrawalRequest> withdrawalRepository,
            IRepository<TeacherWallet> walletRepository,
            IRepository<WalletTransaction> transactionRepository,
            IRepository<Order> orderRepository,
            IConfiguration configuration)
        {
            _withdrawalRepository = withdrawalRepository;
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
            _orderRepository = orderRepository;
            _configuration = configuration;
        }

        public async Task<List<WithdrawalResponseDto>> GetAllRequestsAsync(WithdrawalStatus? statusFilter = null)
        {
            var requests = await _withdrawalRepository.GetAsync<DateTime>(
                where: statusFilter.HasValue ? w => w.Status == statusFilter.Value : null,
                orderBy: w => w.CreatedAt,
                ascending: false,
                relatedEntities: new System.Linq.Expressions.Expression<Func<WithdrawalRequest, object>>[] { w => w.Teacher }
            );

            return requests.Select(w => new WithdrawalResponseDto
            {
                Id = w.Id,
                TeacherId = w.TeacherId,
                TeacherName = w.Teacher?.FullName ?? "Unknown",
                TeacherEmail = w.Teacher?.Email ?? "",
                Amount = w.Amount,
                BankName = w.BankName,
                BankAccountNumber = w.BankAccountNumber,
                BankAccountName = w.BankAccountName,
                Status = w.Status.ToString(),
                AdminNote = w.AdminNote,
                CreatedAt = w.CreatedAt,
                ProcessedAt = w.ProcessedAt
            }).ToList();
        }

        public async Task<WithdrawalResponseDto> ApproveAsync(int requestId, string? adminNote)
        {
            var request = await _withdrawalRepository.FirstOrDefaultAsync(
                w => w.Id == requestId, w => w.Teacher);
            if (request == null)
                throw new Exception("Không tìm thấy yêu cầu rút tiền.");

            if (request.Status != WithdrawalStatus.Pending)
                throw new Exception("Yêu cầu này đã được xử lý trước đó.");

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.TeacherId == request.TeacherId);
            if (wallet == null)
                throw new Exception("Không tìm thấy ví của giáo viên.");

            if (wallet.Balance < request.Amount)
                throw new Exception("Số dư ví không đủ để rút.");

            // Deduct from wallet
            wallet.Balance -= request.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;
            await _walletRepository.UpdateAsync(wallet);

            // Record withdrawal transaction
            var transaction = new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = -request.Amount,
                Type = WalletTransactionType.Withdrawal,
                Description = $"Rút tiền - {request.BankName} - {request.BankAccountNumber}"
            };
            await _transactionRepository.AddAsync(transaction);

            // Update request status
            request.Status = WithdrawalStatus.Approved;
            request.AdminNote = adminNote;
            request.ProcessedAt = DateTime.UtcNow;
            await _withdrawalRepository.UpdateAsync(request);

            return new WithdrawalResponseDto
            {
                Id = request.Id,
                TeacherId = request.TeacherId,
                TeacherName = request.Teacher?.FullName ?? "Unknown",
                TeacherEmail = request.Teacher?.Email ?? "",
                Amount = request.Amount,
                BankName = request.BankName,
                BankAccountNumber = request.BankAccountNumber,
                BankAccountName = request.BankAccountName,
                Status = request.Status.ToString(),
                AdminNote = request.AdminNote,
                CreatedAt = request.CreatedAt,
                ProcessedAt = request.ProcessedAt
            };
        }

        public async Task<WithdrawalResponseDto> RejectAsync(int requestId, string? adminNote)
        {
            var request = await _withdrawalRepository.FirstOrDefaultAsync(
                w => w.Id == requestId, w => w.Teacher);
            if (request == null)
                throw new Exception("Không tìm thấy yêu cầu rút tiền.");

            if (request.Status != WithdrawalStatus.Pending)
                throw new Exception("Yêu cầu này đã được xử lý trước đó.");

            request.Status = WithdrawalStatus.Rejected;
            request.AdminNote = adminNote;
            request.ProcessedAt = DateTime.UtcNow;
            await _withdrawalRepository.UpdateAsync(request);

            return new WithdrawalResponseDto
            {
                Id = request.Id,
                TeacherId = request.TeacherId,
                TeacherName = request.Teacher?.FullName ?? "Unknown",
                TeacherEmail = request.Teacher?.Email ?? "",
                Amount = request.Amount,
                BankName = request.BankName,
                BankAccountNumber = request.BankAccountNumber,
                BankAccountName = request.BankAccountName,
                Status = request.Status.ToString(),
                AdminNote = request.AdminNote,
                CreatedAt = request.CreatedAt,
                ProcessedAt = request.ProcessedAt
            };
        }

        public async Task<AdminRevenueOverviewDto> GetRevenueOverviewAsync()
        {
            var completedOrders = await _orderRepository.GetAsync<DateTime>(
                where: o => o.Status == OrderStatus.Completed,
                orderBy: o => o.PaidAt ?? o.CreatedAt,
                ascending: false
            );

            var totalRevenue = completedOrders.Sum(o => o.Amount);
            var teacherSharePercent = _configuration.GetValue<int>("Revenue:TeacherSharePercent", 70);
            var platformSharePercent = 100 - teacherSharePercent;

            var pendingWithdrawals = await _withdrawalRepository.GetAsync<DateTime>(
                where: w => w.Status == WithdrawalStatus.Pending,
                orderBy: w => w.CreatedAt,
                ascending: false
            );

            // Monthly revenue for the last 6 months
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            var recentOrders = completedOrders.Where(o => (o.PaidAt ?? o.CreatedAt) >= sixMonthsAgo);

            var monthlyRevenue = recentOrders
                .GroupBy(o => (o.PaidAt ?? o.CreatedAt).ToString("yyyy-MM"))
                .Select(g => new MonthlyRevenueDto
                {
                    Month = DateTime.ParseExact(g.Key, "yyyy-MM", CultureInfo.InvariantCulture).ToString("MMM yyyy"),
                    Amount = g.Sum(o => o.Amount)
                })
                .OrderBy(m => m.Month)
                .ToList();

            return new AdminRevenueOverviewDto
            {
                TotalRevenue = totalRevenue,
                PlatformRevenue = totalRevenue * platformSharePercent / 100,
                TeacherRevenue = totalRevenue * teacherSharePercent / 100,
                TotalOrders = completedOrders.Count(),
                PendingWithdrawals = pendingWithdrawals.Count(),
                PendingWithdrawalAmount = pendingWithdrawals.Sum(w => w.Amount),
                MonthlyRevenue = monthlyRevenue
            };
        }
    }
}
