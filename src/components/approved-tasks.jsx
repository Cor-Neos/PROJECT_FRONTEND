import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context.jsx";
import defaultAvatar from "../assets/default-avatar.png";
import api from "../utils/api";

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
                    user.user_role === "Admin" ? "/documents" : `/documents/task/user/${user.user_id}`;

                const data = await api.get(task_endpoint);
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
                const data = await api.get("/users");
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
        return user?.user_profile ? `${api.baseUrl.replace(/\/api$/, "")}${user.user_profile}` : defaultAvatar;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:bg-gray-700 dark:hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    {/* Title Section */}
                    <div className="text-center flex-1 mx-8">
                        <div className="inline-flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                Approved Tasks
                            </h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Track and manage completed tasks</p>
                    </div>

                    {/* Empty space for balance */}
                    <div className="w-14"></div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats and Filters Container */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Stats Cards */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Main Stats Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm font-medium">Approved Tasks</p>
                                        <p className="text-3xl font-bold">{filteredTasks.length}</p>
                                        <p className="text-green-100 text-xs mt-1">of {approvedTasks.length} total</p>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Stats Cards */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">On Time</p>
                                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {filteredTasks.filter(task => task.doc_due_date >= task.doc_date_submitted).length}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Late</p>
                                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                            {filteredTasks.filter(task => task.doc_due_date < task.doc_date_submitted).length}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="xl:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h3>
                                </div>
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Reset All
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {/* Search Filter */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Search</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={filters.search}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                        />
                                        <div className="absolute left-3 top-3.5 p-1 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date Range</label>
                                    <select
                                        value={filters.dateRange}
                                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="week">Last Week</option>
                                        <option value="month">Last Month</option>
                                        <option value="quarter">Last Quarter</option>
                                    </select>
                                </div>

                                {/* Assignee Filter */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Assignee</label>
                                    <select
                                        value={filters.assignee}
                                        onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <option value="all">All Assignees</option>
                                        {users.map((user) => (
                                            <option key={user.user_id} value={user.user_id}>
                                                {getUserFullName(user.user_id)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Submission Status Filter */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                                    <select
                                        value={filters.submissionStatus}
                                        onChange={(e) => setFilters({ ...filters, submissionStatus: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="on-time">On Time</option>
                                        <option value="late">Late</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                {approvedTasks.length === 0 ? (
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                ) : (
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {approvedTasks.length === 0 ? 'No Approved Tasks' : 'No Tasks Found'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg max-w-md mx-auto">
                                {approvedTasks.length === 0
                                    ? 'There are no approved tasks to display at the moment.'
                                    : 'No tasks match your current filters. Try adjusting your search criteria.'
                                }
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Task ID</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Document Name</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tasked To</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tasked By</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date Submitted</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredTasks.map((task, index) => (
                                        <tr
                                            key={task.doc_id}
                                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                                }`}
                                        >
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="text-sm font-bold text-blue-800 dark:text-blue-300">#{task.doc_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white max-w-xs truncate" title={task.doc_name}>
                                                    {task.doc_name}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getUserProfilePicture(task.doc_tasked_to)}
                                                        alt={getUserFullName(task.doc_tasked_to)}
                                                        className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-blue-200 dark:ring-blue-700"
                                                        onError={(e) => {
                                                            e.target.src = defaultAvatar;
                                                        }}
                                                    />
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {getUserFullName(task.doc_tasked_to)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getUserProfilePicture(task.doc_tasked_by)}
                                                        alt={`Atty. ${getUserFullName(task.doc_tasked_by)}`}
                                                        className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-purple-200 dark:ring-purple-700"
                                                        onError={(e) => {
                                                            e.target.src = defaultAvatar;
                                                        }}
                                                    />
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        Atty. {getUserFullName(task.doc_tasked_by)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {new Date(task.doc_due_date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {new Date(task.doc_date_submitted).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    {task.doc_due_date < task.doc_date_submitted && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900 dark:to-red-800 dark:text-red-300 shadow-md">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            Late
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900 dark:to-green-800 dark:text-green-300 shadow-md">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    {task.doc_status.charAt(0).toUpperCase() + task.doc_status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovedTasks;
