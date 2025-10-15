import { useEffect, useState } from "react";
import { ShieldUser, FileText, Archive, FolderKanban } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.png";
import { useAuth } from "../../context/auth-context.jsx";

const data = [
    { name: "Mon", Cases: 400, analytics: 240 },
    { name: "Tue", Cases: 300, analytics: 139 },
    { name: "Wed", Cases: 200, analytics: 980 },
    { name: "Thu", Cases: 278, analytics: 390 },
    { name: "Fri", Cases: 189, analytics: 480 },
    { name: "Sat", Cases: 239, analytics: 380 },
    { name: "Sun", Cases: 349, analytics: 430 },
];

const StatCard = ({ title, value, icon }) => (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-white p-4 shadow dark:bg-slate-900">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            {icon}
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</h3>
    </div>
);

const ChartPlaceholder = ({ title, dataKey }) => (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="h-[200px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="colorData"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                    />
                    <YAxis stroke="#94a3b8" />
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                    />
                    <Tooltip />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorData)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

// format time compactly
const formatDistanceToNow = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
};

export const Reports = () => {
    const navigate = useNavigate();
    const { user } = useAuth() || {};

    if (!user) return null;
    if (user.user_role !== "Admin") {
        navigate("/unauthorized");
        return null;
    }

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    // remove toggle in favor of scrollable list
    // const [showAll, setShowAll] = useState(false);

    // Stat counts
    const [usersCount, setUsersCount] = useState(0);
    const [archivedCasesCount, setArchivedCasesCount] = useState(0);
    const [processingCasesCount, setProcessingCasesCount] = useState(0);
    const [processingDocumentsCount, setProcessingDocumentsCount] = useState(0);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/user-logs", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // Users count (Admins only)
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/users/count", {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch user count");
                const data = await res.json();
                setUsersCount(data.count ?? 0);
            } catch (error) {
                console.error("Failed to fetch user count:", error);
                setUsersCount(0);
            }
        };
        if (user?.user_role === "Admin") fetchUserCount();
    }, [user]);

    // Processing cases count (role-based)
    useEffect(() => {
        const fetchProcessingCasesCount = async () => {
            try {
                const endpoint =
                    user?.user_role === "Admin" || user?.user_role === "Staff"
                        ? "http://localhost:3000/api/cases/count/processing"
                        : `http://localhost:3000/api/cases/count/processing/user/${user.user_id}`;
                const res = await fetch(endpoint, { method: "GET", credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch processing cases count");
                const data = await res.json();
                setProcessingCasesCount(data.count ?? 0);
            } catch (error) {
                console.error("Failed to fetch processing cases count:", error);
                setProcessingCasesCount(0);
            }
        };
        if (user) fetchProcessingCasesCount();
    }, [user]);

    // Archived cases count (role-based)
    useEffect(() => {
        const fetchArchivedCasesCount = async () => {
            try {
                const endpoint =
                    user?.user_role === "Admin" || user?.user_role === "Staff"
                        ? "http://localhost:3000/api/cases/count/archived"
                        : `http://localhost:3000/api/cases/count/archived/user/${user.user_id}`;
                const res = await fetch(endpoint, { method: "GET", credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch archived cases count");
                const data = await res.json();
                setArchivedCasesCount(data.count ?? 0);
            } catch (error) {
                console.error("Failed to fetch archived cases count:", error);
                setArchivedCasesCount(0);
            }
        };
        if (user) fetchArchivedCasesCount();
    }, [user]);

    // Processing documents count
    useEffect(() => {
        const fetchProcessingDocumentsCount = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/documents", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load documents");
                const data = await res.json();
                const statuses = new Set(["processing", "in-progress", "to-do", "pending"]);
                const count = (Array.isArray(data) ? data : []).filter((d) =>
                    statuses.has(
                        String(d.doc_status || "")
                            .toLowerCase()
                            .trim(),
                    ),
                ).length;
                setProcessingDocumentsCount(count);
            } catch (e) {
                console.error("Failed to compute processing documents count:", e);
                setProcessingDocumentsCount(0);
            }
        };
        fetchProcessingDocumentsCount();
    }, []);

    // count processing documents
    useEffect(() => {
        const fetchProcessingDocumentsCount = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/documents/count/processing", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch processing documents count");
                const data = await res.json();
                setProcessingDocumentsCount(data.count ?? 0);
            } catch (error) {
                console.error("Failed to fetch processing documents count:", error);
                setProcessingDocumentsCount(0);
            }
        };
        fetchProcessingDocumentsCount();
    }, []);

    // only show first 5 logs if not expanded
    // const visibleLogs = showAll ? logs : logs.slice(0, 5);
    // scrollable list: show all logs
    const visibleLogs = logs;

    return (
        <div className="space-y-6">
            <h2 className="title">Reports & Analytics</h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Users"
                    value={usersCount}
                    icon={
                        <ShieldUser
                            size={20}
                            className="text-blue-500"
                        />
                    }
                />
                <StatCard
                    title="Archived Cases"
                    value={archivedCasesCount}
                    icon={
                        <Archive
                            size={20}
                            className="text-green-500"
                        />
                    }
                />
                <StatCard
                    title="Processing Cases"
                    value={processingCasesCount}
                    icon={
                        <FolderKanban
                            size={20}
                            className="text-orange-500"
                        />
                    }
                />
                <StatCard
                    title="Processing Documents"
                    value={processingDocumentsCount}
                    icon={
                        <FileText
                            size={20}
                            className="text-purple-500"
                        />
                    }
                />
            </div>

            {/* Chart */}
            <div className="relative rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                <span className="absolute right-4 top-4 z-10 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Last 7 Days</span>

                <div className="grid grid-cols-4 gap-6 lg:grid-cols-1">
                    <ChartPlaceholder
                        title="Completed Cases"
                        dataKey="Cases"
                    />
                </div>
            </div>

            {/* User Activity Logs */}
            <div className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Activity</h2>
                    <button
                        onClick={() => navigate("/user-logs")}
                        className="text-xl font-bold text-blue-800 hover:underline"
                    >
                        View all
                    </button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500">Loading logs...</p>
                ) : (
                    <>
                        <div className="max-h-80 w-full overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-100 text-left text-gray-600 dark:bg-gray-800">
                                    <tr>
                                        <th className="p-2">USER</th>
                                        <th className="p-2">ACTION</th>
                                        <th className="p-2">DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleLogs.map((log) => (
                                        <tr
                                            key={log.user_log_id}
                                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            {/* USER */}
                                            <td className="flex items-center gap-2 p-2">
                                                {log.user_profile ? (
                                                    <img
                                                        src={`http://localhost:3000${log.user_profile}`}
                                                        alt={log.user_fullname}
                                                        className="h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-xs font-bold text-white">
                                                        {log.user_fullname?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-slate-900 dark:text-white">{log.user_fullname}</span>
                                            </td>

                                            {/* ACTION */}
                                            <td className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-600 dark:text-gray-400">{log.user_log_action}</span>
                                                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(log.user_log_time))}</span>
                                                </div>
                                            </td>

                                            {/* DATE */}
                                            <td className="p-2 text-slate-700 dark:text-slate-300">
                                                {log.user_log_time
                                                    ? new Date(log.user_log_time).toLocaleString("en-US", {
                                                          year: "numeric",
                                                          month: "long",
                                                          day: "numeric",
                                                      })
                                                    : ""}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Reports;