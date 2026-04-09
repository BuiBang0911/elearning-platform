import { createBrowserRouter } from "react-router-dom";
import Root from "../pages/Root";
import LandingPage from "../pages/LandingPage";
import NotFound from "../pages/NotFound";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import InstructorDashboard from "../pages/InstructorDashboard";
import StudentDashboard from "../pages/StudentDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "instructor", Component: InstructorDashboard },
      { path: "student", Component: StudentDashboard },
      { path: "*", Component: NotFound },
    ],
  },
]);
