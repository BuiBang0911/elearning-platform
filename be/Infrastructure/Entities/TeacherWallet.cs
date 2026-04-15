using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class TeacherWallet : BaseEntity
    {
        public int TeacherId { get; set; }
        public decimal Balance { get; set; } = 0;
        public decimal TotalEarned { get; set; } = 0;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual User Teacher { get; set; }
        public virtual ICollection<WalletTransaction> Transactions { get; set; }
    }
}
