using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.DTOs
{
    public class TeacherRevenueStatsDto
    {
        public decimal Balance { get; set; }
        public decimal TotalEarned { get; set; }
        public decimal PendingWithdrawal { get; set; }
        public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
        public List<RecentOrderDto> RecentOrders { get; set; } = new();
    }

    public class MonthlyRevenueDto
    {
        public string Month { get; set; }
        public decimal Amount { get; set; }
    }

    public class RecentOrderDto
    {
        public int OrderId { get; set; }
        public string StudentName { get; set; }
        public string CourseTitle { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TeacherShare { get; set; }
        public DateTime PaidAt { get; set; }
    }

    public class WithdrawalRequestDto
    {
        public decimal Amount { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
    }

    public class WithdrawalResponseDto
    {
        public int Id { get; set; }
        public int TeacherId { get; set; }
        public string TeacherName { get; set; }
        public string TeacherEmail { get; set; }
        public decimal Amount { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public string Status { get; set; }
        public string? AdminNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    public class AdminRevenueOverviewDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal PlatformRevenue { get; set; }
        public decimal TeacherRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int PendingWithdrawals { get; set; }
        public decimal PendingWithdrawalAmount { get; set; }
        public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
    }

    public class AdminWithdrawalActionDto
    {
        public string? AdminNote { get; set; }
    }
}
