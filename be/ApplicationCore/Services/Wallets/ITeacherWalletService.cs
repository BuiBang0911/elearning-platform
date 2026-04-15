using ApplicationCore.DTOs;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Wallets
{
    public interface ITeacherWalletService
    {
        Task<TeacherWallet> GetOrCreateWalletAsync(int teacherId);
        Task AddRevenueAsync(int teacherId, decimal amount, int orderId, string description);
        Task<TeacherRevenueStatsDto> GetRevenueStatsAsync(int teacherId);
        Task<List<WalletTransaction>> GetTransactionsAsync(int teacherId);
        Task<WithdrawalRequest> RequestWithdrawalAsync(int teacherId, WithdrawalRequestDto request);
    }
}
