import type { AdminRevenueOverview, WithdrawalResponse } from "../interfaces/Payment";
import api from "./index.api";

export interface AdminDashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
  studentGrowth: number;
  instructorGrowth: number;
  courseGrowth: number;
  enrollmentGrowth: number;
  enrollmentTrends: { month: string; count: number }[];
  categoryDistribution: { categoryName: string; courseCount: number }[];
  aiUsage: {
    totalQuestions: number;
    avgResponseTimeSeconds: number;
    engagementRate: number;
    avgConversationDepth: number;
    activeUsersRatio: number;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isDelete: boolean;
  createdAt: string;
  enrollmentCount: number;
}

export interface AdminCourse {
  id: number;
  title: string;
  instructorName: string;
  categoryName: string;
  studentCount: number;
  rating: number;
  createdAt: string;
}

const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const res = await api.get("/admin/dashboard-stats");
  return res.data;
};

const getUsers = async (): Promise<AdminUser[]> => {
  const res = await api.get("/admin/users");
  return res.data;
};

const toggleUserStatus = async (userId: number): Promise<void> => {
  await api.post(`/admin/users/${userId}/toggle-status`);
};

const getCourses = async (): Promise<AdminCourse[]> => {
  const res = await api.get("/admin/courses");
  return res.data;
};

const deleteCourse = async (courseId: number): Promise<void> => {
  await api.delete(`/admin/courses/${courseId}`);
};

// ===== WITHDRAWAL & REVENUE =====

const getWithdrawals = async (status?: string): Promise<WithdrawalResponse[]> => {
  const params = status ? { status } : {};
  const res = await api.get("/admin/withdrawals", { params });
  return res.data;
};

const approveWithdrawal = async (id: number, adminNote?: string): Promise<WithdrawalResponse> => {
  const res = await api.post(`/admin/withdrawals/${id}/approve`, { adminNote });
  return res.data;
};

const rejectWithdrawal = async (id: number, adminNote?: string): Promise<WithdrawalResponse> => {
  const res = await api.post(`/admin/withdrawals/${id}/reject`, { adminNote });
  return res.data;
};

const getRevenueOverview = async (): Promise<AdminRevenueOverview> => {
  const res = await api.get("/admin/revenue-overview");
  return res.data;
};

const AdminApi = {
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  getCourses,
  deleteCourse,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getRevenueOverview,
};

export default AdminApi;
