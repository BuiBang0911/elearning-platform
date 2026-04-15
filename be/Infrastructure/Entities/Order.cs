using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Entities
{
    public class Order : BaseEntity
    {
        public int CourseId { get; set; }
        public int StudentId { get; set; }
        public long OrderCode { get; set; }
        public decimal Amount { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public string? PaymentLinkId { get; set; }
        public string? CheckoutUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }

        // Navigation
        public virtual Course Course { get; set; }
        public virtual User Student { get; set; }
    }

    public enum OrderStatus
    {
        Pending = 0,
        Completed = 1,
        Cancelled = 2
    }
}
