import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Brain } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { UserRole } from "../../interfaces/auth";
import AuthApi from "../../api/auth.api";

export default function RegisterPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const roleFromUrl = searchParams.get("role") || "student";

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [errors, setErrors] = useState<FormErrors>({
		fullName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const [isLoading, setIsLoading] = useState(false);

	type FormErrors = {
		fullName?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	};

	const handleRegister = async (role: UserRole) => {
		// Basic validation
		if (!validate()) {
			return;
		}
		try {
			setIsLoading(true);
			await AuthApi.register({ email, fullName: name, password, role });
			setIsLoading(false);
			navigate("/login");
		}
		catch (err) {
			console.error("Registration failed:", err);
			setIsLoading(false);
		}
	};

	const validate = () => {
		const newErrors: FormErrors = {};

		if (!name.trim()) {
			newErrors.fullName = "Full name is required";
		}

		if (!email.trim()) {
			newErrors.email = "Email is required";
		}

		if (!password) {
			newErrors.password = "Password is required";
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = "Confirm password is required";
		} else if (confirmPassword !== password) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);

		return Object.keys(newErrors).length === 0;
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
					<p className="text-gray-600">Create your account</p>
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
								handleRegister(UserRole.STUDENT);
							}}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="student-name">Full Name</Label>
								<Input
									id="student-name"
									type="text"
									placeholder="John Doe"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
								{errors.fullName && (
									<p className="text-red-500 text-sm">{errors.fullName}</p>
								)}
							</div>
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
								{errors.email && (
									<p className="text-red-500 text-sm">{errors.email}</p>
								)}
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
								{errors.password && (
									<p className="text-red-500 text-sm">{errors.password}</p>
								)}
							</div>
							<div>
								<Label htmlFor="student-confirm-password">Confirm Password</Label>
								<Input
									id="student-confirm-password"
									type="password"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
								{errors.confirmPassword && (
									<p className="text-red-500 text-sm">{errors.confirmPassword}</p>
								)}
							</div>
							<Button type="submit" className="w-full">
								Register as Student
							</Button>
						</form>
					</TabsContent>

					<TabsContent value="instructor">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleRegister(UserRole.INSTRUCTOR);
							}}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="instructor-name">Full Name</Label>
								<Input
									id="instructor-name"
									type="text"
									placeholder="Jane Smith"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
								{errors.fullName && (
									<p className="text-red-500 text-sm">{errors.fullName}</p>
								)}
							</div>
							<div>
								<Label htmlFor="instructor-email">Email</Label>
								<Input
									id="instructor-email"
									type="email"
									placeholder="instructor@edumind.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
								{errors.email && (
									<p className="text-red-500 text-sm">{errors.email}</p>
								)}
							</div>
							<div>
								<Label htmlFor="instructor-password">Password</Label>
								<Input
									id="instructor-password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
								{errors.password && (
									<p className="text-red-500 text-sm">{errors.password}</p>
								)}
							</div>
							<div>
								<Label htmlFor="instructor-confirm-password">Confirm Password</Label>
								<Input
									id="instructor-confirm-password"
									type="password"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
								{errors.confirmPassword && (
									<p className="text-red-500 text-sm">{errors.confirmPassword}</p>
								)}
							</div>
							<Button type="submit" className="w-full">
								Register as Instructor
							</Button>
							<p className="text-sm text-gray-500 text-center">
								Demo: Fill in the form and register
							</p>
						</form>
					</TabsContent>

					<TabsContent value="admin">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleRegister(UserRole.ADMIN);
							}}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="admin-name">Full Name</Label>
								<Input
									id="admin-name"
									type="text"
									placeholder="Admin User"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
								{errors.fullName && (
									<p className="text-red-500 text-sm">{errors.fullName}</p>
								)}
							</div>
							<div>
								<Label htmlFor="admin-email">Email</Label>
								<Input
									id="admin-email"
									type="email"
									placeholder="admin@edumind.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
								{errors.email && (
									<p className="text-red-500 text-sm">{errors.email}</p>
								)}

							</div>
							<div>
								<Label htmlFor="admin-password">Password</Label>
								<Input
									id="admin-password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
								{errors.password && (
									<p className="text-red-500 text-sm">{errors.password}</p>
								)}

							</div>
							<div>
								<Label htmlFor="admin-confirm-password">Confirm Password</Label>
								<Input
									id="admin-confirm-password"
									type="password"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
								{errors.confirmPassword && (
									<p className="text-red-500 text-sm">{errors.confirmPassword}</p>
								)}

							</div>
							<Button type="submit" className="w-full">
								Register as Admin
							</Button>
							<p className="text-sm text-gray-500 text-center">
								Demo: Fill in the form and register
							</p>
						</form>
					</TabsContent>
				</Tabs>

				<div className="mt-6 text-center space-y-2">
					<p className="text-sm text-gray-600">
						Already have an account?{" "}
						<Link to="/login" className="text-blue-600 hover:underline font-medium">
							Sign in here
						</Link>
					</p>
					<Link to="/" className="text-sm text-blue-600 hover:underline block">
						Back to Home
					</Link>
				</div>
			</Card>
		</div>
	);
}