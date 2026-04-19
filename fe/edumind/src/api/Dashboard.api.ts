import type { DashboardStats } from "../interfaces/dashboard";
import api from "./index.api";

export interface InstructorDashboardStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalMaterials: number;
  aiUsage: {
    totalQuestions: number;
    avgResponseTimeSeconds: number;
  };
  enrollmentTrends: { month: string; count: number }[];
  recentReviews: {
    studentName: string;
    courseTitle: string;
    rating: number;
    date: string;
  }[];
  topCourses: {
    id: number;
    title: string;
    studentCount: number;
    rating: number;
  }[];
}

export interface CourseDetailStats {
  totalStudents: number;
  averageRating: number;
  aiQuestionsCount: number;
  enrollmentTrend: { month: string; count: number }[];
  recentReviews: {
    studentName: string;
    courseTitle: string;
    rating: number;
    date: string;
  }[];
}

const getStudentDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get(`/Dashboard/student-stats`);
  return res.data;
}

const getInstructorDashboardStats = async (): Promise<InstructorDashboardStats> => {
  const res = await api.get(`/Dashboard/instructor-stats`);
  return res.data;
}

const getCourseDetailStats = async (courseId: number): Promise<CourseDetailStats> => {
  const res = await api.get(`/Dashboard/course-stats/${courseId}`);
  return res.data;
}

export const DashboardApi = {
  getStudentDashboardStats,
  getInstructorDashboardStats,
  getCourseDetailStats,
};