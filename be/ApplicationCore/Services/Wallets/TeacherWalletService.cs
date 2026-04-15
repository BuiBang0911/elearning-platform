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

namespace ApplicationCore.Services.Wallets
{
    public class TeacherWalletService : ITeacherWalletService
    {
        private readonly IRepository<TeacherWallet> _walletRepository;
        private readonly IRepository<WalletTransaction> _transactionRepository;
        private readonly IRepository<WithdrawalRequest> _withdrawalRepository;
        private readonly IRepository<Order> _orderRepository;
        private readonly IConfiguration _configuration;

        public TeacherWalletService(
            IRepository<TeacherWallet> walletRepository,
            IRepository<WalletTransaction> transactionRepository,
            IRepository<WithdrawalRequest> withdrawalRepository,
            IRepository<Order> orderRepository,
            IConfiguration configuration)
        {
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
            _withdrawalRepository = withdrawalRepository;
            _orderRepository = orderRepository;
            _configuration = configuration;
        }

        public async Task<TeacherWallet> GetOrCreateWalletAsync(int teacherId)
        {
            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.TeacherId == teacherId);
            if (wallet == null)
            {
                wallet = new TeacherWallet
                {
                    TeacherId = teacherId,
                    Balance = 0,
                    TotalEarned = 0
                };
                wallet = await _walletRepository.AddAsync(wallet);
            }
            return wallet;
        }

        public async Task AddRevenueAsync(int teacherId, decimal amount, int orderId, string description)
        {
            var wallet = await GetOrCreateWalletAsync(teacherId);

            wallet.Balance += amount;
            wallet.TotalEarned += amount;
            wallet.UpdatedAt = DateTime.UtcNow;
            await _walletRepository.UpdateAsync(wallet);

            var transaction = new WalletTransaction
            {
                WalletId = wallet.Id,
                OrderId = orderId,
                Amount = amount,
                Type = WalletTransactionType.CourseRevenue,
                Description = description
            };
            await _transactionRepository.AddAsync(transaction);
        }

        public async Task<TeacherRevenueStatsDto> GetRevenueStatsAsync(int teacherId)
        {
            var wallet = await GetOrCreateWalletAsync(teacherId);

            // Calculate pending withdrawal amount
            var pendingWithdrawals = await _withdrawalRepository.GetAsync<DateTime>(
                where: w => w.TeacherId == teacherId && w.Status == WithdrawalStatus.Pending,
                orderBy: w => w.CreatedAt,
                ascending: false
            );
            var pendingAmount = pendingWithdrawals.Sum(w => w.Amount);

            // Get monthly revenue for the last 6 months
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            var transactions = await _transactionRepository.GetAsync<DateTime>(
                where: t => t.WalletId == wallet.Id && t.Type == WalletTransactionType.CourseRevenue && t.CreatedAt >= sixMonthsAgo,
                orderBy: t => t.CreatedAt,
                ascending: true
            );

            var monthlyRevenue = transactions
                .GroupBy(t => t.CreatedAt.ToString("yyyy-MM"))
                .Select(g => new MonthlyRevenueDto
                {
                    Month = DateTime.ParseExact(g.Key, "yyyy-MM", CultureInfo.InvariantCulture).ToString("MMM yyyy"),
                    Amount = g.Sum(t => t.Amount)
                })
                .ToList();

            // Get recent completed orders for this teacher's courses
            var recentOrders = await _orderRepository.GetAsync<DateTime>(
                where: o => o.Course.LecturerId == teacherId && o.Status == OrderStatus.Completed,
                orderBy: o => o.PaidAt ?? o.CreatedAt,
                ascending: false,
                count: 10,
                relatedEntities: new System.Linq.Expressions.Expression<Func<Order, object>>[] { o => o.Course, o => o.Student }
            );

            var teacherSharePercent = _configuration.GetValue<int>("Revenue:TeacherSharePercent", 70);

            return new TeacherRevenueStatsDto
            {
                Balance = wallet.Balance,
                TotalEarned = wallet.TotalEarned,
                PendingWithdrawal = pendingAmount,
                MonthlyRevenue = monthlyRevenue,
                RecentOrders = recentOrders.Select(o => new RecentOrderDto
                {
                    OrderId = o.Id,
                    StudentName = o.Student?.FullName ?? "Unknown",
                    CourseTitle = o.Course?.Title ?? "Unknown",
                    TotalAmount = o.Amount,
                    TeacherShare = o.Amount * teacherSharePercent / 100,
                    PaidAt = o.PaidAt ?? o.CreatedAt
                }).ToList()
            };
        }

        public async Task<List<WalletTransaction>> GetTransactionsAsync(int teacherId)
        {
            var wallet = await GetOrCreateWalletAsync(teacherId);
            var transactions = await _transactionRepository.GetAsync<DateTime>(
                where: t => t.WalletId == wallet.Id,
                orderBy: t => t.CreatedAt,
                ascending: false,
                count: 50
            );
            return transactions.ToList();
        }

        public async Task<WithdrawalRequest> RequestWithdrawalAsync(int teacherId, WithdrawalRequestDto request)
        {
            var wallet = await GetOrCreateWalletAsync(teacherId);

            var minWithdrawal = _configuration.GetValue<decimal>("Revenue:MinWithdrawalAmount", 2000000);

            if (request.Amount < minWithdrawal)
                throw new Exception($"Số tiền rút tối thiểu là {minWithdrawal:N0}đ.");

            if (request.Amount > wallet.Balance)
                throw new Exception("Số dư không đủ để thực hiện rút tiền.");

            // Check for pending withdrawal
            var pendingWithdrawal = await _withdrawalRepository.FirstOrDefaultAsync(
                w => w.TeacherId == teacherId && w.Status == WithdrawalStatus.Pending);
            if (pendingWithdrawal != null)
                throw new Exception("Bạn đã có yêu cầu rút tiền đang chờ xử lý.");

            var withdrawal = new WithdrawalRequest
            {
                TeacherId = teacherId,
                Amount = request.Amount,
                BankName = request.BankName,
                BankAccountNumber = request.BankAccountNumber,
                BankAccountName = request.BankAccountName,
                Status = WithdrawalStatus.Pending
            };

            return await _withdrawalRepository.AddAsync(withdrawal);
        }
    }
}
