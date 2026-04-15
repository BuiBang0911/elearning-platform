using ApplicationCore.DTOs;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.Withdrawals
{
    public interface IWithdrawalService
    {
        Task<List<WithdrawalResponseDto>> GetAllRequestsAsync(WithdrawalStatus? statusFilter = null);
        Task<WithdrawalResponseDto> ApproveAsync(int requestId, string? adminNote);
        Task<WithdrawalResponseDto> RejectAsync(int requestId, string? adminNote);
        Task<AdminRevenueOverviewDto> GetRevenueOverviewAsync();
    }
}
