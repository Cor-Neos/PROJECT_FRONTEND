import { useEffect, useState } from "react";
import api from "../utils/api.js";
import boslogo from "@/assets/boslogo_white.png";
import { Mail, Lock, Eye, EyeOff, User, Phone, Briefcase, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

const Register = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [user_fname, setFName] = useState("");
    const [user_mname, setMName] = useState("");
    const [user_lname, setLName] = useState("");
    const [user_email, setEmail] = useState("");
    const [user_password, setPassword] = useState("");
    const [user_phonenum, setPhone] = useState("");
    const [user_role, setRole] = useState("Paralegal");
    const [branch_id, setBranchId] = useState("");
    const [user_profile, setProfile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [branches, setBranches] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!user || user.user_role !== "Admin") {
            navigate("/unauthorized");
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await api.get("/branches");
                setBranches(data);
            } catch (err) {
                console.error("Failed to load branches:", err);
            }
        };

        fetchBranches();
    }, []);

    const handleRegistration = async (e) => {
        const toastId = toast.loading("Adding new user...");
        e.preventDefault();

        const formData = new FormData();
        formData.append("user_email", user_email);
        formData.append("user_password", user_password);
        formData.append("user_fname", user_fname);
        formData.append("user_mname", user_mname);
        formData.append("user_lname", user_lname);
        formData.append("user_phonenum", user_phonenum);
        formData.append("user_role", user_role);
        formData.append("branch_id", branch_id);
        formData.append("created_by", user?.user_id);

        if (user_profile) {
            formData.append("user_profile", user_profile);
        }

        try {
            const data = await api.post("/users", formData, { headers: {} });
            setMessage("✅ User successfully registered.");
            toast.success("User successfully added!", { id: toastId, duration: 4000 });
            setFName("");
            setMName("");
            setLName("");
            setEmail("");
            setPassword("");
            setPhone("");
            setRole("Paralegal");
            setBranchId("");
            setProfile(null);
            setPreview(null);
        } catch (err) {
            console.error(err);
            setMessage(err?.data?.error || "❌ Registration failed.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
            <div className="w-full max-w-4xl rounded-2xl bg-[#173B7E] p-10 text-white shadow-2xl">
                <div className="mb-4 flex justify-center">
                    <img
                        src={boslogo}
                        alt="BOS Logo"
                        className="w-40 md:w-52"
                    />
                </div>

                <h2 className="mb-6 text-center text-3xl font-bold">Register a New User</h2>

                {message && <div className="mb-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-900 shadow">{message}</div>}

                <form
                    onSubmit={handleRegistration}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    {/* First Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                        <input
                            type="text"
                            value={user_fname}
                            onChange={(e) => setFName(e.target.value)}
                            placeholder="First Name"
                            className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    {/* Middle Name */}
                    <input
                        type="text"
                        value={user_mname}
                        onChange={(e) => setMName(e.target.value)}
                        placeholder="Middle Name (optional)"
                        className="w-full rounded-md border border-blue-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Last Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                        <input
                            type="text"
                            value={user_lname}
                            onChange={(e) => setLName(e.target.value)}
                            placeholder="Last Name"
                            className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                        <input
                            type="email"
                            value={user_email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={user_password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        <div
                            className="absolute right-3 top-2.5 cursor-pointer text-gray-300 hover:text-gray-100"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                        <input
                            type="text"
                            value={user_phonenum}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone Number"
                            className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    {/* Role */}
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                        <select
                            value={user_role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-md border border-blue-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="Staff">Staff</option>
                            <option value="Paralegal">Paralegal</option>
                            <option value="Lawyer">Lawyer</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {/* Branch Selection */}
                    <div className="relative">
                        <select
                            value={branch_id}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="w-full rounded-md border border-blue-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="">Select Branch</option>
                            {branches.map((branch) => (
                                <option
                                    key={branch.branch_id}
                                    value={branch.branch_id}
                                >
                                    {branch.branch_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Profile Upload & Preview */}
                    <div className="col-span-1 flex flex-col items-center gap-2 md:col-span-2">
                        {preview && (
                            <img
                                src={preview}
                                alt="Profile Preview"
                                className="h-24 w-24 rounded-full border-2 border-white object-cover shadow"
                            />
                        )}
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-white hover:underline">
                            <Image className="h-5 w-5" />
                            <span>Upload Profile Picture</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setProfile(file);
                                        setPreview(URL.createObjectURL(file));
                                    }
                                }}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="col-span-1 md:col-span-2">
                        <button
                            type="submit"
                            className="w-full rounded-md bg-white py-2 font-semibold text-blue-900 transition hover:bg-gray-100"
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
