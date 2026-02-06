import { Outlet } from "react-router-dom";

const AuthLayout = () => {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="hidden lg:flex items-center justify-center bg-indigo-50">
                <img
                    src="/assets/images/auth-illustration.svg"
                    alt="Auth illustration"
                    className="max-w-md"
                />
            </div>

            <div className="flex items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
