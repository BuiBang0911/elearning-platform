import AuthHeader from "../../components/Auth/AuthHeader";

const Login = () => {
    return (
        <>
            <AuthHeader
                rightText="Don't have account?"
                rightLink="/register"
                rightLabel="Create Account"
            />

            <h1 className="text-2xl font-bold mb-6 text-center">
                Sign in to your account
            </h1>

            <form className="space-y-4">
                <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <input
                        type="email"
                        placeholder="Email address..."
                        className="w-full border border-[#E9EAF0] outline outline-[#E9EAF0] px-4 py-2 rounded mt-1"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-600">Password</label>
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full border border-[#E9EAF0] outline outline-[#E9EAF0] px-4 py-2 rounded mt-1"
                    />
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" id="rememberMe" />
                    <label htmlFor="rememberMe">Remember me</label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-orange-500 text-white py-3 rounded-[10px] hover:bg-orange-600"
                >
                    Sign In →
                </button>
            </form>
        </>
    );
};

export default Login;
