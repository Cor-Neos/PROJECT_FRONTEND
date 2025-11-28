import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boslogo from "@/assets/light_logo.png";
import { Lock, Eye, EyeOff } from "lucide-react";
import Spinner from "@/components/loading";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function ChangePass() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const { token } = useParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            try {
                await api.post("/reset-password", { token, newPassword });
            } catch (e) {
                setError(e.data?.error || e.message || "Failed to reset password.");
                setLoading(false);
                return;
            }

            {
                setSuccess("Password changed successfully! You may now log in.");

                const toastId = toast.loading("Changing password...", {
                    duration: 4000,
                });

                toast.success("Password changed successfully!", {
                    id: toastId,
                    duration: 4000,
                });

                setTimeout(() => {
                    navigate("/login");
                }, 4000);

                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        }
        setLoading(false);
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

                {/* Change Password Form Section */}
                <div
                    className="flex h-auto w-full flex-col justify-center rounded-2xl p-8 text-white shadow-2xl md:h-[600px] md:w-[50%] md:p-10"
                    style={{ backgroundColor: "#173B7E" }}
                >
                    <h2 className="mb-7 text-center text-3xl font-bold md:text-left">Change Password</h2>

                    {error && <div className="mb-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow">{error}</div>}
                    {success && <div className="mb-4 rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-700 shadow">{success}</div>}

                    <form
                        className="space-y-4"
                        onSubmit={handleSubmit}
                    >
                        {/* New Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                                className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                            <div
                                className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                                required
                            />
                            <div
                                className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-md bg-white py-2 font-semibold text-blue-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    Resetting...
                                    <Spinner />
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
