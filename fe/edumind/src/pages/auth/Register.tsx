import AuthHeader from "../../components/Auth/AuthHeader";

const Register = () => {
    return (
        <>
            <AuthHeader
                rightText="Already have account?"
                rightLink="/login"
                rightLabel="Sign In"
            />

            <h1 className="text-2xl font-bold mb-6 text-center">
                Create your account
            </h1>

            <form className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                        type="text"
                        placeholder="First name..."
                        className="w-full border border-[#E9EAF0] outline-[#E9EAF0] px-4 py-2 rounded"
                    />
                    <input
                        type="text"
                        placeholder="Last name..."
                        className="w-full border border-[#E9EAF0] outline-[#E9EAF0] px-4 py-2 rounded"
                    />
                </div>

                <input
                    type="text"
                    placeholder="Username..."
                    className="w-full border border-[#E9EAF0] outline outline-[#E9EAF0] px-4 py-2 rounded"
                />

                <input
                    type="email"
                    placeholder="Email address"
                    className="w-full border border-[#E9EAF0] outline outline-[#E9EAF0] px-4 py-2 rounded"
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                        type="password"
                        placeholder="Create password"
                        className="border border-[#E9EAF0] outline outline-[#E9EAF0] px-4 py-2 rounded"
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        className="border border-[#E9EAF0] outline outline-[#E9EAF0] px-4 py-2 rounded"
                    />
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <input id="rules" type="checkbox" />
                    <label htmlFor="rules">
                        I agree with all of your{" "}
                        <span className="text-orange-500">
                            Terms & Conditions
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-orange-500 text-white py-3 rounded-[10px] hover:bg-orange-600"
                >
                    Create Account
                </button>
            </form>
        </>
    );
};

export default Register;
