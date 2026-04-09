import type { DashboardStats } from "../interfaces/dashboard";
import api from "./index.api";

const getStudentDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get(`/Dashboard/student-stats`);
  return res.data;
}

export const DashboardApi = {
  getStudentDashboardStats,
};