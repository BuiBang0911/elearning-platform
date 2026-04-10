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
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { UserRole } from "../interfaces/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
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
      { path: "*", Component: NotFound },
    ],
  },
]);
