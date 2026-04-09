import { Brain, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import type { UserResponse } from "../../interfaces/auth";
import authApi from "../../api/auth.api";

type Props = {
  currentUser: UserResponse | null;
};

const HeaderStudent = ({ currentUser }: Props) => {
    const navigate = useNavigate();
    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            navigate("/");
        }
    };

    return (
        <header className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                EduMind
                            </span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/student" className="text-sm font-medium text-blue-600">
                                My Learning
                            </Link>
                            <Link to="/browse" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                Browse Courses
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* <Button
                            variant={showAIChat ? "default" : "outline"}
                            onClick={() => setShowAIChat(!showAIChat)}
                            className="gap-2"
                        >
                            <Brain className="w-4 h-4" />
                            <span className="hidden sm:inline">AI Assistant</span>
                        </Button> */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium">{currentUser?.fullName}</p>
                                <p className="text-xs text-gray-500">Student</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                {currentUser?.fullName?.charAt(0)}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                logout();
                                navigate("/");
                            }}
                            className="hidden sm:flex"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                        {/* <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button> */}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default HeaderStudent