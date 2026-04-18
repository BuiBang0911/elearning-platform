import { useState } from "react";
import { Brain } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { UserRole } from "../../interfaces/auth";
import AuthApi from "../../api/auth.api";
import { toast } from "sonner";



import { useAuth } from "../../context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [searchParams] = useSearchParams();
    // const roleFromUrl = searchParams.get("role") || "student";

    const [errors, setErrors] = useState({ email: "", password: "" });

    const validate = () => {
        let valid = true;
        const newErrors = { email: "", password: "" };

        if (!email.trim()) {
            newErrors.email = "Email is required";
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Invalid email format";
            valid = false;
        }

        if (!password) {
            newErrors.password = "Password is required";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setIsLoading(true);

            // Fetch user role from context after successful login
            await AuthApi.login({ email, password, role: UserRole.STUDENT }); // Backend ignores role anyway but interface expects it

            const userData = await AuthApi.getMe();
            await refreshUser(); // Ensure context is updated

            toast.success("Login successful!");

            // Dynamic redirection based on user role
            if (userData.role === UserRole.ADMIN) {
                navigate("/admin", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            setIsLoading(false);

            const errorData = err.response?.data;
            let errorMessage = "Login failed. Please check your credentials.";

            if (typeof errorData === "string") {
                errorMessage = errorData;
            } else if (errorData?.errors) {
                errorMessage = Object.values(errorData.errors).flat().join(", ");
            } else if (errorData?.title) {
                errorMessage = errorData.title;
            }

            toast.error(errorMessage);
        }
    };

    if (isLoading) {
        return <FullPageLoader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            EduMind
                        </span>
                    </div>
                    <p className="text-gray-600">Sign in to your account</p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="password">Password</Label>
                            <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <Button 
                        type="submit" 
                        loading={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity h-12 text-lg font-bold shadow-lg shadow-blue-200"
                    >
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-blue-600 hover:underline font-medium">
                            Sign up here
                        </Link>
                    </p>
                    <Link to="/" className="text-sm text-blue-600 hover:underline block">
                        Back to Home
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default Login;
