import { useEffect, useState } from "react";
import { FileText, Archive, FolderKanban, FlagTriangleRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.png";
import { useAuth } from "../../context/auth-context.jsx";

const StatCard = ({ title, value, icon }) => (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-white p-4 shadow dark:bg-slate-900">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            {icon}
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</h3>
    </div>
);

const ChartPlaceholder = ({ title, chartData }) => (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="h-[200px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="colorCompleted"
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
                        <linearGradient
                            id="colorDismissed"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#ef4444"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="#ef4444"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />

                    {/* Completed line */}
                    <Area
                        type="monotone"
                        dataKey="Completed"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                        name="Completed"
                    />

                    {/* Dismissed line */}
                    <Area
                        type="monotone"
                        dataKey="Dismissed"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorDismissed)"
                        name="Dismissed"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Simple legend */}
        <div className="mt-2 flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Completed
            </div>
            <div className="flex items-center gap-1 text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-600" /> Dismissed
            </div>
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

    const [lastWeekCount, setLastWeekCount] = useState({
        completed: [{ monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }],
        dismissed: [{ monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }],
    });

    // Fetching the actual last week counts from the server
    useEffect(() => {
        const fetchLastWeekCounts = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/reports/last-week", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                setLastWeekCount({
                    completed: [data.completed],
                    dismissed: [data.dismissed],
                });
            } catch (err) {
                console.error("Error fetching last week counts:", err);
            }
        };
        fetchLastWeekCounts();
    }, []);

    const [monthlyCount, setMonthlyCount] = useState({
        completed: [
            {
                january: 0,
                february: 0,
                march: 0,
                april: 0,
                may: 0,
                june: 0,
                july: 0,
                august: 0,
                september: 0,
                october: 0,
                november: 0,
                december: 0,
            },
        ],
        dismissed: [
            {
                january: 0,
                february: 0,
                march: 0,
                april: 0,
                may: 0,
                june: 0,
                july: 0,
                august: 0,
                september: 0,
                october: 0,
                november: 0,
                december: 0,
            },
        ],
    });

    // Fetching the actual monthly counts from the server
    useEffect(() => {
        const fetchMonthlyCounts = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/reports/monthly", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                setMonthlyCount({
                    completed: [data.completed],
                    dismissed: [data.dismissed],
                });
            } catch (err) {
                console.error("Error fetching monthly counts:", err);
            }
        };
        fetchMonthlyCounts();
    }, []);

    // for quarterly counts, we can derive from monthly counts
    const [quarterlyCount, setQuarterlyCount] = useState({
        completed: [{ q1: 0, q2: 0, q3: 0, q4: 0 }],
        dismissed: [{ q1: 0, q2: 0, q3: 0, q4: 0 }],
    });

    useEffect(() => {
        const computeQuarterlyCounts = () => {
            const completed = monthlyCount.completed[0];
            const dismissed = monthlyCount.dismissed[0];
            const quarterlyCompleted = {
                q1: completed.january + completed.february + completed.march,
                q2: completed.april + completed.may + completed.june,
                q3: completed.july + completed.august + completed.september,
                q4: completed.october + completed.november + completed.december,
            };
            const quarterlyDismissed = {
                q1: dismissed.january + dismissed.february + dismissed.march,
                q2: dismissed.april + dismissed.may + dismissed.june,
                q3: dismissed.july + dismissed.august + dismissed.september,
                q4: dismissed.october + dismissed.november + dismissed.december,
            };
            setQuarterlyCount({
                completed: [quarterlyCompleted],
                dismissed: [quarterlyDismissed],
            });
        };
        computeQuarterlyCounts();
    }, [monthlyCount]);

    // CHART STATE
    const [chartType, setChartType] = useState("weekly");

    // generate chart data dynamically
    const getChartData = () => {
        if (chartType === "weekly") {
            const completed = lastWeekCount.completed[0];
            const dismissed = lastWeekCount.dismissed[0];
            return Object.keys(completed).map((day) => ({
                name: day.charAt(0).toUpperCase() + day.slice(1),
                Completed: completed[day],
                Dismissed: dismissed[day],
            }));
        } else if (chartType === "monthly") {
            const completed = monthlyCount.completed[0];
            const dismissed = monthlyCount.dismissed[0];
            return Object.keys(completed).map((month) => ({
                name: month.charAt(0).toUpperCase() + month.slice(1),
                Completed: completed[month],
                Dismissed: dismissed[month],
            }));
        } else if (chartType === "quarterly") {
            const completed = quarterlyCount.completed[0];
            const dismissed = quarterlyCount.dismissed[0];
            return Object.keys(completed).map((q) => ({
                name: q.toUpperCase(),
                Completed: completed[q],
                Dismissed: dismissed[q],
            }));
        }
        return [];
    };

    const chartData = getChartData();

    // Logs and counts (unchanged)
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [caseCounts, setCaseCounts] = useState({
        completed: 0,
        dismissed: 0,
        archivedCompleted: 0,
        archivedDismissed: 0,
    });

    // fetching case counts
    useEffect(() => {
        const fetchCaseCounts = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/reports/case-counts", {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch case counts");
                const data = await res.json();
                setCaseCounts(data);
            } catch (err) {
                console.error("Error fetching case counts:", err);
            }
        };
        fetchCaseCounts();
    }, []);

    // fetching logs
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/user-logs", { method: "GET", credentials: "include" });
                const data = await res.json();

                // filtering logs for completed, dismissed, and archived actions only and does not include the ones with "New allowed viewer(s)" text
                const filtered = data.filter(
                    (log) =>
                        /status: completed|status: dismissed|archived /i.test(log.user_log_action) &&
                        !/New allowed viewer\(s\)/i.test(log.user_log_action),
                );
                setLogs(filtered);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const visibleLogs = logs;

    return (
        <div className="space-y-6">
            <h2 className="title">Reports & Analytics</h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Completed Cases"
                    value={caseCounts.completed}
                    icon={
                        <FolderKanban
                            size={20}
                            className="text-blue-500"
                        />
                    }
                />
                <StatCard
                    title="Dismissed Cases"
                    value={caseCounts.dismissed}
                    icon={
                        <FolderKanban
                            size={20}
                            className="text-red-500"
                        />
                    }
                />
                <StatCard
                    title="Archived Completed Cases"
                    value={caseCounts.archivedCompleted}
                    icon={
                        <Archive
                            size={20}
                            className="text-green-500"
                        />
                    }
                />
                <StatCard
                    title="Archived Dismissed Cases"
                    value={caseCounts.archivedDismissed}
                    icon={
                        <Archive
                            size={20}
                            className="text-purple-500"
                        />
                    }
                />
            </div>

            {/* CHART SECTION */}
            <div className="relative rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                {/* Chart Header: Toggles + Year */}
                <div className="mb-4 flex flex-wrap items-center justify-between">
                    {/* Toggle buttons */}
                    <div className="flex gap-2">
                        {[
                            { label: "This Week", value: "weekly" },
                            { label: "Monthly", value: "monthly" },
                            { label: "Quarterly", value: "quarterly" },
                        ].map((btn) => (
                            <button
                                key={btn.value}
                                onClick={() => setChartType(btn.value)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${chartType === btn.value
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Current Year */}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{new Date().getFullYear()}</span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <ChartPlaceholder
                        title="Completed & Dismissed Cases"
                        dataKey="Completed"
                        chartData={chartData}
                    />

                    <p className="flex items-center gap-1 text-xs italic text-gray-400 opacity-80">
                        <FlagTriangleRight size={16} />
                        Note: This data includes the archived cases that are closed/completed or dismissed
                    </p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Completions, Dismissals and Archive</h2>
                    <button
                        onClick={() => navigate("/user-logs")}
                        className="text-lg font-bold text-blue-800 hover:underline"
                    >
                        View All Logs
                    </button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500">Loading logs...</p>
                ) : (
                    <div className="max-h-80 w-full overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 text-left text-gray-500 dark:bg-gray-800">
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
                                        <td className="flex items-center gap-2 p-2">
                                            {log.user_profile ? (
                                                <img
                                                    src={`http://localhost:3000${log.user_profile}` || defaultAvatar}
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
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-600 dark:text-gray-400">{log.user_log_action}</span>
                                                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(log.user_log_time))}</span>
                                            </div>
                                        </td>
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
                )}
            </div>
        </div>
    );
};

export default Reports;
