export interface PaymentLinkResponse {
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
}

export interface OrderResponse {
  id: number;
  courseId: number;
  courseTitle: string;
  courseThumbnail: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export interface WalletBalance {
  balance: number;
  totalEarned: number;
}

export interface TeacherRevenueStats {
  balance: number;
  totalEarned: number;
  pendingWithdrawal: number;
  monthlyRevenue: MonthlyRevenue[];
  recentOrders: RecentOrder[];
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface RecentOrder {
  orderId: number;
  studentName: string;
  courseTitle: string;
  totalAmount: number;
  teacherShare: number;
  paidAt: string;
}

export interface WithdrawalRequestInput {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface WithdrawalResponse {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface AdminRevenueOverview {
  totalRevenue: number;
  platformRevenue: number;
  teacherRevenue: number;
  totalOrders: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  monthlyRevenue: MonthlyRevenue[];
}
