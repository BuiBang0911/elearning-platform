using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class WalletTransaction : BaseEntity
    {
        public int WalletId { get; set; }
        public int? OrderId { get; set; }
        public decimal Amount { get; set; }
        public WalletTransactionType Type { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual TeacherWallet Wallet { get; set; }
        public virtual Order? Order { get; set; }
    }

    public enum WalletTransactionType
    {
        CourseRevenue = 0,
        Withdrawal = 1
    }
}
