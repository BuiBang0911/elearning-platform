import { Brain, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import authApi from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

const HeaderStudent = () => {
    const { user, logout: clearAuth } = useAuth();
    const navigate = useNavigate();
    const logout = async () => {
        try {
            await authApi.logout();
            clearAuth();
            navigate("/");
        } catch (error) {
            console.error("Error during logout:", error);
            // Even if API fails, we should clear local state
            clearAuth();
            navigate("/");
        }
    };

    return (
        <header className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/assets/images/logo.png" alt="EduMind" className="w-14 h-14 object-contain" />
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                EduMind
                            </span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/student" className="text-sm font-medium text-blue-600">
                                My Learning
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium">{user?.fullName}</p>
                                <p className="text-xs text-gray-500">Student</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                {user?.fullName?.charAt(0)}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                logout();
                            }}
                            className="hidden sm:flex"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default HeaderStudent