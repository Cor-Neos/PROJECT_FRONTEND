import React, { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import {
    FileMinus,
    Users,
    ShieldUser,
    Archive,
    FolderOpen,
    UserRoundMinus,
    ListTodo
} from "lucide-react";
import defaultAvatar from "@/assets/default-avatar.png";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/auth-context";
import api from "@/utils/api";

const DashboardPage = () => {
    const { theme } = useTheme();
    const { user } = useAuth();

    const [userLogs, setUserLogs] = useState([]);
    const [overViewData, setOverviewData] = useState([]);

    const [counts, setCounts] = useState({
        users: 0,
        clients: 0,
        processingCases: 0,
        archivedCases: 0,
        docsForApproval: 0,
        processingDocs: 0,
        pendingTasks: 0,
    });

    // ---------- FETCH HELPER (centralized api) ----------
    const fetchData = async (path, setter, fallback = 0) => {
        try {
            const data = await api.get(path);
            setter(data?.count ?? fallback);
        } catch {
            setter(fallback);
        }
    };

    // ---------- USERS (ADMIN & SUPERLAWYER) ----------
    useEffect(() => {
        if (user?.user_role === "Admin" || user?.user_role === "SuperLawyer") {
            fetchData("/users/count", (v) =>
                setCounts((p) => ({ ...p, users: v }))
            );
        }
    }, [user]);

    // ---------- CLIENTS ----------
    useEffect(() => {
        if (user) {
            fetchData("/clients/count", (v) =>
                setCounts((p) => ({ ...p, clients: v }))
            );
        }
    }, [user]);

    // ---------- PROCESSING CASES ----------
    useEffect(() => {
        if (!user) return;

        const endpoint =
            ["Admin", "Staff", "SuperLawyer"].includes(user.user_role)
                ? "/cases/count/processing"
                : `/cases/count/processing/user/${user.user_id}`;

        fetchData(endpoint, (v) =>
            setCounts((p) => ({ ...p, processingCases: v }))
        );
    }, [user]);

    // ---------- ARCHIVED CASES ----------
    useEffect(() => {
        if (!user) return;

        const endpoint =
            ["Admin", "Staff", "SuperLawyer"].includes(user.user_role)
                ? "/cases/count/archived"
                : `/cases/count/archived/user/${user.user_id}`;

        fetchData(endpoint, (v) =>
            setCounts((p) => ({ ...p, archivedCases: v }))
        );
    }, [user]);

    // ---------- DOCUMENT COUNTS ----------
    useEffect(() => {
        if (!user) return;

        const pendingTaskUrl =
            ["Admin", "SuperLawyer"].includes(user.user_role)
                ? "/documents/count/pending-tasks"
                : `/documents/count/pending-tasks/${user.user_id}`;

        const processingDocumentsUrl =
            user.user_role === "Lawyer"
                ? "/documents/count/processing/lawyer"
                : "/documents/count/processing";

        const endpoints = [
            {
                url: "/documents/count/for-approval",
                key: "docsForApproval",
            },
            {
                url: processingDocumentsUrl,
                key: "processingDocs",
            },
            {
                url: pendingTaskUrl,
                key: "pendingTasks",
            },
        ];

        Promise.all(
            endpoints.map(({ url, key }) =>
                fetchData(url, (v) => setCounts((p) => ({ ...p, [key]: v })))
            )
        );
    }, [user]);

    // ---------- USER LOGS ----------
    useEffect(() => {
        if (!user) return;

        const fetchUserLogs = async () => {
            try {
                const path =
                    ["Admin", "SuperLawyer"].includes(user.user_role)
                        ? "/user-logs"
                        : `/user-logs/${user.user_id}`;

                const data = await api.get(path);
                setUserLogs(Array.isArray(data) ? data : []);
            } catch { }
        };

        fetchUserLogs();
    }, [user]);

    // ---------- CASE CATEGORIES ----------
    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.get("/reports/case-counts-by-category");
                setOverviewData([
                    { name: "Civil", total: data?.civil || 0 },
                    { name: "Criminal", total: data?.criminal || 0 },
                    { name: "Special Proceedings", total: data?.special_proceedings || 0 },
                    { name: "Constitutional", total: data?.constitutional || 0 },
                    { name: "Jurisdictional", total: data?.jurisdictional || 0 },
                    { name: "Special Courts", total: data?.special_courts || 0 },
                ]);
            } catch { }
        };
        load();
    }, []);

    // ---------- CARD COMPONENT ----------
    const Card = ({ title, value, icon }) => (
        <div className="card w-full">
            <div className="card-header">
                <p className="card-title">{title}</p>
                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-600">
                    {icon}
                </div>
            </div>
            <div className="card-body bg-slate-100 dark:bg-slate-950">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {value}
                </p>
            </div>
        </div>
    );

    // --------- BUILD THE CARDS LIST (SUPER IMPORTANT FOR LAYOUT) ----------
    const cards = [];

    if (["Admin", "SuperLawyer"].includes(user.user_role)) {
        cards.push(
            <Card key="users" title="Users" value={counts.users} icon={<ShieldUser size={26} />} />
        );
    }

    if (["Admin", "Lawyer", "SuperLawyer"].includes(user.user_role)) {
        cards.push(
            <Card key="archived" title="Archived Cases" value={counts.archivedCases} icon={<Archive size={26} />} />,
            <Card key="processingCases" title="Processing Cases" value={counts.processingCases} icon={<FolderOpen size={26} />} />
        );
    }

    if (user.user_role !== "Paralegal") {
        cards.push(
            <Card key="processingDocs" title="Processing Documents" value={counts.processingDocs} icon={<FileMinus size={26} />} />,
            <Card key="clients" title="Clients" value={counts.clients} icon={<Users size={26} />} />
        );
    }

    cards.push(
        <Card key="approvals" title="Pending Approvals" value={counts.docsForApproval} icon={<UserRoundMinus size={26} />} />,
        <Card key="tasks" title="Pending Tasks" value={counts.pendingTasks} icon={<ListTodo size={26} />} />
    );

    // ---------- NORMAL GRID (ALL ROLES EXCEPT SUPERLAWYER) ----------
    const getGridClasses = () => {
        if (user.user_role === "Staff") return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
        if (user.user_role === "Paralegal") return "grid-cols-1 sm:grid-cols-2 gap-4";
        if (user.user_role === "Admin") return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
        if (user.user_role === "Lawyer") return "lg:grid-cols-3";
        return "lg:grid-cols-3";
    };

    return (
        <div className="flex flex-col gap-y-3">
            <h1 className="title">Dashboard</h1>
            <p className="dark:text-slate-300">
                Welcome back {user?.user_fname}! Here's your overview.
            </p>

            {/* ---------- SUPERLAWYER SPECIAL LAYOUT ---------- */}
            {user.user_role === "SuperLawyer" ? (
                <div className="w-full space-y-4">

                    {/* FIRST ROW – EXACTLY 4 CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cards.slice(0, 4)}
                    </div>

                    {/* SECOND ROW – TIGHT SQUEEZED CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {cards.slice(4, 7).map((card, index) => (
                            <div key={index} className="w-full scale-[0.88] -my-2">
                                {card}
                            </div>
                        ))}
                    </div>


                </div>
            ) : (
                /* ---------- NORMAL LAYOUT FOR OTHER ROLES ---------- */
                <div className={`grid gap-4 ${getGridClasses()}`}>
                    {cards}
                </div>
            )}

            {/* ---------- CHART + ACTIVITY ---------- */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart */}
                <div className="card col-span-1 md:col-span-2 lg:col-span-4">
                    <div className="card-header">
                        <p className="card-title">Overview of Cases in BOS' Law Firm</p>
                    </div>
                    <div className="card-body p-0">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={overViewData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <XAxis
                                    dataKey="name"
                                    stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                    tick={{ fontSize: 12 }}
                                    angle={-30}
                                    textAnchor="end"
                                    interval={0}
                                    height={60}
                                />

                                <YAxis stroke={theme === "light" ? "#475569" : "#94a3b8"} tickMargin={6} />

                                <Tooltip formatter={(value) => `${value}`} />

                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#2563eb"
                                    fill="url(#colorTotal)"
                                    fillOpacity={1}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="card-header">
                        <p className="card-title">Recent Activity</p>
                    </div>
                    <div className="card-body h-[300px] overflow-auto p-0">
                        {userLogs.length > 0 ? (
                            userLogs.slice(0, 4).map((log) => (
                                <div
                                    key={log.user_log_id}
                                    className="flex items-center justify-between gap-x-4 rounded-lg py-2 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-x-4">
                                            <img
                                                src={log.user_profile ? `${api.baseUrl.replace(/\/api$/, '')}${log.user_profile}` : defaultAvatar}
                                            alt={log.user_fullname || "User"}
                                            className="ml-2 size-10 rounded-full object-cover"
                                        />
                                        <div className="flex flex-col gap-y-1">
                                            <p className="text-sm font-medium dark:text-slate-200">
                                                {log.user_fullname || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {log.user_log_action}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold dark:text-slate-200">
                                            {new Date(log.user_log_time).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(log.user_log_time).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
