import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Image, Mail, Lock, Eye, EyeOff, Phone, Briefcase } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import api from "../utils/api";

const AddUser = ({ onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [user_fname, setFName] = useState("");
    const [user_mname, setMName] = useState("");
    const [user_lname, setLName] = useState("");
    const [user_email, setEmail] = useState("");
    const [user_password, setPassword] = useState("");
    const [user_phonenum, setPhone] = useState("");
    const [user_role, setRole] = useState("");
    const [branch_id, setBranchId] = useState("");
    const [user_profile, setProfile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [branches, setBranches] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const modalRef = useRef(null);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await api.get("/branches");
                setBranches(data);
            } catch (err) {
                console.error("Failed to load branches:", err);
                setError(err.message || "Failed to load branches.");
            }
        };

        fetchBranches();
    }, []);

    useClickOutside([modalRef], () => {
        onClose();
        setProfile(null);
    });

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError("");
        const toastId = toast.loading("Adding new user...");

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
            const data = await api.post("/users", formData);

            if (data) {
                toast.success("User successfully added!", {
                    id: toastId,
                    duration: 4000,
                });

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

                onClose();
            }
        } catch (err) {
            console.error("Error adding user:", err);
            setError(err.message || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                ref={modalRef}
                className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800"
            >
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">Add New User</h2>
                {error && <div className="mb-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-red-50 shadow">{error}</div>}

                <form
                    className="space-y-6"
                    onSubmit={handleAddUser}
                >
                    <div className="flex justify-center">
                        <div className="flex flex-col items-center gap-2">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-24 w-24 rounded-full border border-gray-300 object-cover dark:border-slate-700"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-gray-100 text-sm text-gray-400 dark:border-slate-600 dark:bg-slate-700">
                                    <User className="h-10 w-10" />
                                </div>
                            )}

                            <label className="flex cursor-pointer items-center gap-2 hover:underline">
                                <Image className="h-4 w-4 dark:text-slate-200" />
                                <span className="text-xs dark:text-slate-200 dark:hover:underline">Upload Profile Picture</span>
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
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                            <input
                                type="text"
                                value={user_fname}
                                onChange={(e) => setFName(e.target.value)}
                                placeholder="First Name"
                                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                                required
                            />
                        </div>

                        <input
                            type="text"
                            value={user_mname}
                            onChange={(e) => setMName(e.target.value)}
                            placeholder="Middle Name (optional)"
                            className="w-full rounded-md border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                        />

                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                            <input
                                type="text"
                                value={user_lname}
                                onChange={(e) => setLName(e.target.value)}
                                placeholder="Last Name"
                                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                            <input
                                type="email"
                                value={user_email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={user_password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                                required
                            />
                            <div
                                className="absolute right-3 top-2.5 cursor-pointer text-gray-300 hover:text-gray-100"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </div>
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                            <input
                                type="text"
                                value={user_phonenum}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone Number"
                                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                            />
                        </div>

                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                            <select
                                value={user_role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                                required
                            >
                                <option
                                    value=""
                                    disabled
                                    className="dark:bg-slate-800 dark:text-white"
                                >
                                    Select Role
                                </option>
                                <option
                                    value="Paralegal"
                                    className="dark:bg-slate-800 dark:text-white"
                                >
                                    Paralegal
                                </option>
                                <option
                                    value="Staff"
                                    className="dark:bg-slate-800 dark:text-white"
                                >
                                    Staff
                                </option>
                                <option
                                    value="Lawyer"
                                    className="dark:bg-slate-800 dark:text-white"
                                >
                                    Lawyer
                                </option>
                                <option
                                    value="Admin"
                                    className="dark:bg-slate-800 dark:text-white"
                                >
                                    Super Lawyer
                                </option>
                            </select>
                        </div>

                        <div className="relative">
                            <select
                                value={branch_id}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-transparent dark:text-white"
                                required
                            >
                                <option
                                    value=""
                                    disabled
                                    className="dark:bg-slate-800 dark:text-white"
                                >
                                    Select Branch
                                </option>
                                {branches.map((branch) => (
                                    <option
                                        key={branch.branch_id}
                                        value={branch.branch_id}
                                        className="dark:bg-slate-800 dark:text-white"
                                    >
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>

                <button
                    onClick={onClose}
                    className="absolute right-2 top-2 text-2xl text-gray-500 hover:text-gray-700"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default AddUser;
