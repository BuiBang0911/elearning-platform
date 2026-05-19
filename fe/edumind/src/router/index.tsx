import { createBrowserRouter } from "react-router-dom";
import Root from "../pages/Root";
import LandingPage from "../pages/LandingPage";
import NotFound from "../pages/NotFound";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import InstructorDashboard from "../pages/InstructorDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import CourseDetail from "../pages/student/CourseDetail";
import LearningScreen from "../pages/student/LearningScreen";
import PaymentSuccess from "../pages/student/PaymentSuccess";
import PaymentCancel from "../pages/student/PaymentCancel";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUserManagement from "../pages/admin/AdminUserManagement";
import AdminCourseManagement from "../pages/admin/AdminCourseManagement";
import AdminWithdrawals from "../pages/admin/AdminWithdrawals";
import AdminRevenueOverview from "../pages/admin/AdminRevenueOverview";
import AdminInstructorRequests from "../pages/admin/AdminInstructorRequests";
import AdminLayout from "../components/Admin/AdminLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { UserRole } from "../interfaces/auth";
import ApplyInstructor from "../pages/student/ApplyInstructor";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: Login },
      { path: "register", Component: Register },

      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "users", element: <AdminUserManagement /> },
          { path: "courses", element: <AdminCourseManagement /> },
          { path: "withdrawals", element: <AdminWithdrawals /> },
          { path: "revenue", element: <AdminRevenueOverview /> },
          { path: "instructor-requests", element: <AdminInstructorRequests /> },
        ]
      },
      {
        path: "instructor",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <InstructorDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
            <StudentDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "apply-instructor",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <ApplyInstructor />
          </ProtectedRoute>
        )
      },
      {
        path: "student/course/:id",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
            <CourseDetail />
          </ProtectedRoute>
        )
      },
      {
        path: "student/course/:id/learn",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
            <LearningScreen />
          </ProtectedRoute>
        )
      },
      {
        path: "payment/success",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
            <PaymentSuccess />
          </ProtectedRoute>
        )
      },
      {
        path: "payment/cancel",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
            <PaymentCancel />
          </ProtectedRoute>
        )
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
