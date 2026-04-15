using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class WithdrawalRequest : BaseEntity
    {
        public int TeacherId { get; set; }
        public decimal Amount { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
        public string? AdminNote { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }

        // Navigation
        public virtual User Teacher { get; set; }
    }

    public enum WithdrawalStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
}
