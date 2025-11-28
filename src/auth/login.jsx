import { useState } from "react";
import api from "../utils/api.js";
import boslogo from "@/assets/light_logo.png";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Spinner from "@/components/loading";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const toastId = toast.loading("Authenticating...", { duration: 4000 });

        try {
            const data = await api.post("/login", { email, password });

            // OTP required if user is not verified
            if (data.message === "OTP sent to your email" && data.user_id) {
                // Temporarily store user_id and email in session/localStorage
                localStorage.setItem("pendingUserId", data.user_id);
                localStorage.setItem("pendingUserEmail", email);

                // Redirect to OTP verification
                navigate("/verify");
                return;
            }

            // If user is verified
            if (data.user) {
                // Store user in your auth context or state
                login(data.user);

                localStorage.removeItem("pendingUserId");
                localStorage.removeItem("pendingUserEmail");

                toast.success("Login successful!", { id: toastId, duration: 4000 });
                navigate("/");
                return;
            }

            setError("Unexpected response from server.");
            setLoading(false);
        } catch (err) {
            console.error("Login error:", err);
            setError(err?.data?.error || err.message || "Something went wrong. Please try again.");
            toast.error("Login failed. Please try again.", { id: toastId, duration: 4000 });
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
            <div className="flex w-full max-w-[1000px] flex-col items-center justify-center gap-10 md:flex-row">
                {/* Logo Section */}
                <div className="flex h-[300px] w-full items-center justify-center rounded-2xl bg-blue-100 shadow-lg md:h-[600px] md:w-full">
                    <img
                        src={boslogo}
                        alt="BOS Logo"
                        className="w-60 md:w-[400px]"
                    />
                </div>

                {/* Login Form Section */}
                <div
                    className="flex h-auto w-full flex-col justify-center rounded-2xl p-8 text-white shadow-2xl md:h-[600px] md:w-[50%] md:p-10"
                    style={{ backgroundColor: "#173B7E" }}
                >
                    <h2 className="mb-7 text-center text-3xl font-bold md:text-left">Login</h2>

                    {error && <div className="mb-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow">{error}</div>}

                    <form
                        className="space-y-4"
                        onSubmit={handleLogin}
                    >
                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                            <div
                                className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="mr-2"
                            />
                            <label htmlFor="remember">Remember me</label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-md bg-white py-2 font-semibold text-blue-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    Authenticating...
                                    <Spinner />
                                </>
                            ) : (
                                "Login"
                            )}
                        </button>

                        {/* Forgot Password button */}
                        <div className="mt-2 text-center text-sm text-blue-200">
                            <a
                                href="/forgot-password"
                                className="hover:underline"
                            >
                                Forgot password?
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
