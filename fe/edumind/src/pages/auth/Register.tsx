import { Link, useNavigate, useSearchParams } from "react-router";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { UserRole } from "../../interfaces/auth";
import AuthApi from "../../api/auth.api";
import { toast } from "sonner";

export default function RegisterPage() {
	const navigate = useNavigate();
	// const [searchParams] = useSearchParams();
	// const roleFromUrl = searchParams.get("role") || "student";

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
			toast.success("Registration successful! Please login.");
			navigate("/login");
		}
		catch (err: any) {
			console.error("Registration failed:", err);
			setIsLoading(false);
			
			const errorData = err.response?.data;
			let errorMessage = "Registration failed. Please try again.";
			
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



	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md p-8">
				<div className="text-center mb-8">
					<div className="inline-flex items-center gap-2 mb-4">
						<img src="/assets/images/logo.png" alt="EduMind" className="w-16 h-16 object-contain" />
						<span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							EduMind
						</span>
					</div>
					<p className="text-gray-600">Create your account</p>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleRegister(UserRole.STUDENT);
					}}
					className="space-y-6"
				>
					<div>
						<Label htmlFor="name">Full Name</Label>
						<Input
							id="name"
							type="text"
							placeholder="John Doe"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="mt-1"
						/>
						{errors.fullName && (
							<p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
						)}
					</div>
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
						{errors.email && (
							<p className="text-red-500 text-xs mt-1">{errors.email}</p>
						)}
					</div>
					<div>
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="mt-1"
						/>
						{errors.password && (
							<p className="text-red-500 text-xs mt-1">{errors.password}</p>
						)}
					</div>
					<div>
						<Label htmlFor="confirm-password">Confirm Password</Label>
						<Input
							id="confirm-password"
							type="password"
							placeholder="••••••••"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className="mt-1"
						/>
						{errors.confirmPassword && (
							<p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
						)}
					</div>
					<Button 
						type="submit" 
						loading={isLoading}
						className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity h-12 text-lg font-bold shadow-lg shadow-blue-200"
					>
						Create Account
					</Button>
					<p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
						By signing up, you agree to our Terms of Service and Privacy Policy.
					</p>
				</form>

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