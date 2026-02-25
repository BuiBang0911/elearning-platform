import { createBrowserRouter } from "react-router-dom";
import AuthLayout from "../layouts/auth/AuthLayout";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import HomePage from "../pages/HomePage/HomePage";

export const router = createBrowserRouter([
    { path: "/", element: <HomePage /> },
    {
        element: <AuthLayout />,
        children: [
            { path: "/login", element: <Login /> },
            { path: "/register", element: <Register /> },
        ],
    },
]);
