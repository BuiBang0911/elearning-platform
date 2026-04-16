import { useState } from "react";
import { Brain, Link } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { Card } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
    const roleFromUrl = searchParams.get("role") || "student";

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

    const handleSubmit = async (role: UserRole) => {
        if (!validate()) return;

        try {
            setIsLoading(true);

            await AuthApi.login({ email, password, role });
            
            // Explicitly wait for refreshUser to populate context
            await refreshUser();
            
            toast.success("Login successful!");

            // navigate theo role sau khi login thành công
            if (role === UserRole.STUDENT) {
                navigate("/student", { replace: true });
            } else if (role === UserRole.INSTRUCTOR) {
                navigate("/instructor", { replace: true });
            } else if (role === UserRole.ADMIN) {
                navigate("/admin", { replace: true });
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            toast.error(err.response?.data || "Login failed. Please check your credentials.");
            setIsLoading(false);
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

                <Tabs defaultValue={roleFromUrl} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="student">Student</TabsTrigger>
                        <TabsTrigger value="instructor">Instructor</TabsTrigger>
                        <TabsTrigger value="admin">Admin</TabsTrigger>
                    </TabsList>

                    <TabsContent value="student">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit(UserRole.STUDENT);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="student-email">Email</Label>
                                <Input
                                    id="student-email"
                                    type="email"
                                    placeholder="student@edumind.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <Label htmlFor="student-password">Password</Label>
                                <Input
                                    id="student-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <Button type="submit" className="w-full">
                                Sign In as Student
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="instructor">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit(UserRole.INSTRUCTOR);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="instructor-email">Email</Label>
                                <Input
                                    id="instructor-email"
                                    type="email"
                                    placeholder="instructor@edumind.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="instructor-password">Password</Label>
                                <Input
                                    id="instructor-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Sign In as Instructor
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="admin">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit(UserRole.ADMIN);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="admin-email">Email</Label>
                                <Input
                                    id="admin-email"
                                    type="email"
                                    placeholder="admin@edumind.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="admin-password">Password</Label>
                                <Input
                                    id="admin-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Sign In as Admin
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-blue-600 hover:underline">
                        Back to Home
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default Login;
