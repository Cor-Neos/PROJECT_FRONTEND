import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context.jsx";
import defaultAvatar from "../assets/default-avatar.png";

const ApprovedTasks = () => {
    const { user } = useAuth();

    const [approvedTasks, setApprovedTasks] = useState([]);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        dateRange: 'all',
        assignee: 'all',
        submissionStatus: 'all'
    });

    useEffect(() => {
        // Fetch approved tasks for the user
        const fetchApprovedTasks = async () => {
            try {
                const task_endpoint =
                    user.user_role === "Admin"
                        ? "http://localhost:3000/api/documents"
                        : `http://localhost:3000/api/documents/task/user/${user.user_id}`;

                const response = await fetch(task_endpoint, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                // Filter tasks with doc_status "approved"
                const data = await response.json();
                const approvedTasks = data.filter((task) => task.doc_status === "approved");
                setApprovedTasks(approvedTasks);
                setFilteredTasks(approvedTasks);
            } catch (error) {
                console.error("Error fetching approved tasks:", error);
                setError("Failed to fetch approved tasks.");
            }
        };

        fetchApprovedTasks();
    }, [user]);

    // fetch users to get full name of tasked to
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/users", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : data.users || []);
            } catch (error) {
                console.error("Error fetching users:", error);
                setError("Failed to fetch users.");
            }
        };

        fetchUsers();
    }, []);

    // Apply filters to tasks
    useEffect(() => {
        let filtered = [...approvedTasks];

        // Search filter
        if (filters.search) {
            filtered = filtered.filter(task =>
                task.doc_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                getUserFullName(task.doc_tasked_to).toLowerCase().includes(filters.search.toLowerCase()) ||
                getUserFullName(task.doc_tasked_by).toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (filters.dateRange) {
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case 'quarter':
                    filterDate.setMonth(now.getMonth() - 3);
                    break;
            }

            filtered = filtered.filter(task =>
                new Date(task.doc_date_submitted) >= filterDate
            );
        }

        // Assignee filter
        if (filters.assignee !== 'all') {
            filtered = filtered.filter(task => task.doc_tasked_to === parseInt(filters.assignee));
        }

        // Submission status filter (late/on-time)
        if (filters.submissionStatus !== 'all') {
            if (filters.submissionStatus === 'late') {
                filtered = filtered.filter(task => task.doc_due_date < task.doc_date_submitted);
            } else if (filters.submissionStatus === 'on-time') {
                filtered = filtered.filter(task => task.doc_due_date >= task.doc_date_submitted);
            }
        }

        setFilteredTasks(filtered);
    }, [approvedTasks, filters, users]);

    // Reset filters
    const resetFilters = () => {
        setFilters({
            search: '',
            dateRange: 'all',
            assignee: 'all',
            submissionStatus: 'all'
        });
    };

    // get full name by user id
    const getUserFullName = (assignedById) => {
        if (!Array.isArray(users)) return "Unknown";
        const user = users.find((u) => u.user_id === assignedById);
        return user ? `${user.user_fname} ${user.user_mname ? user.user_mname[0] + "." : ""} ${user.user_lname}` : "Unknown";
    };

    // get user profile picture by user id
    const getUserProfilePicture = (assignedById) => {
        if (!Array.isArray(users)) return defaultAvatar;
        const user = users.find((u) => u.user_id === assignedById);
        return user?.user_profile ? `http://localhost:3000${user.user_profile}` : defaultAvatar;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-0 md:p-0 flex flex-row">
            {/* Sidebar: Stats & Filters */}
            <aside className="hidden lg:flex flex-col w-96 min-w-80 max-w-xs h-screen sticky top-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl p-8 space-y-8 z-10">
                {/* Stats */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-700 p-6 shadow">
                    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Overview</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total</span>
                            <span className="font-bold text-2xl text-green-600 dark:text-green-400">{approvedTasks.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">On Time</span>
                            <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{filteredTasks.filter(task => task.doc_due_date >= task.doc_date_submitted).length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Late</span>
                            <span className="font-bold text-2xl text-red-600 dark:text-red-400">{filteredTasks.filter(task => task.doc_due_date < task.doc_date_submitted).length}</span>
                        </div>
                    </div>
                </div>
                {/* Filters */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-6 shadow">
                    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Filters</h2>
                    <div className="space-y-4">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        {/* Date Range */}
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All Time</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="quarter">Last Quarter</option>
                        </select>
                        {/* Assignee */}
                        <select
                            value={filters.assignee}
                            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All Assignees</option>
                            {users.map((user) => (
                                <option key={user.user_id} value={user.user_id}>
                                    {getUserFullName(user.user_id)}
                                </option>
                            ))}
                        </select>
                        {/* Status */}
                        <select
                            value={filters.submissionStatus}
                            onChange={(e) => setFilters({ ...filters, submissionStatus: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="on-time">On Time</option>
                            <option value="late">Late</option>
                        </select>
                        <button
                            onClick={resetFilters}
                            className="w-full mt-2 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all duration-200 shadow-md"
                        >
                            Reset All
                        </button>
                    </div>
                </div>
            </aside>
            {/* Main Content: Task Cards */}
            <main className="flex-1 min-h-screen p-4 md:p-8 overflow-x-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approved Tasks</h1>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow hover:bg-blue-50 dark:hover:bg-gray-600 transition"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>
                {error && (
                    <div className="p-4 mb-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {approvedTasks.length === 0 ? 'No Approved Tasks' : 'No Tasks Found'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4 text-base max-w-md text-center">
                            {approvedTasks.length === 0
                                ? 'There are no approved tasks to display at the moment.'
                                : 'No tasks match your current filters. Try adjusting your search criteria.'}
                        </p>
                        {approvedTasks.length > 0 && filteredTasks.length === 0 && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {filteredTasks.map((task) => (
                            <div key={task.doc_id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-4 hover:shadow-2xl transition">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200 dark:border-blue-700">
                                        <img
                                            src={getUserProfilePicture(task.doc_tasked_to)}
                                            alt={getUserFullName(task.doc_tasked_to)}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = defaultAvatar; }}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Assigned to</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{getUserFullName(task.doc_tasked_to)}</div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-blue-700 dark:text-blue-300 truncate" title={task.doc_name}>{task.doc_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400">Task ID:</span>
                                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300">#{task.doc_id}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-700">
                                        <img
                                            src={getUserProfilePicture(task.doc_tasked_by)}
                                            alt={`Atty. ${getUserFullName(task.doc_tasked_by)}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = defaultAvatar; }}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Assigned by</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Atty. {getUserFullName(task.doc_tasked_by)}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">Due</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(task.doc_due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">Submitted</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(task.doc_date_submitted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">Status</span>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${task.doc_due_date < task.doc_date_submitted ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'} shadow`}>
                                            {task.doc_due_date < task.doc_date_submitted ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            ) : (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            )}
                                            {task.doc_due_date < task.doc_date_submitted ? 'Late' : 'On Time'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ApprovedTasks;
