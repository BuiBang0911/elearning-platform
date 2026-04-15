using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.DTOs
{
    public class CreatePaymentRequest
    {
        public int CourseId { get; set; }
    }

    public class PaymentLinkResponse
    {
        public long OrderCode { get; set; }
        public string CheckoutUrl { get; set; }
        public string QrCode { get; set; }
    }

    public class OrderResponse
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseTitle { get; set; }
        public string CourseThumbnail { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
