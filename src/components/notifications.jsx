import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Mail, MailOpen, X, Search, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

const Notifications = () => {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/notifications/${user.user_id}`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (res.ok) setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setNotifications([]);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const allSelected = notifications.length > 0 && selectedNotifications.length === notifications.length;
    const allSelectedAreRead = notifications.filter((n) => selectedNotifications.includes(n.notification_id)).every((n) => n.is_read);

    const markSelectedAsReadOrUnread = async () => {
        try {
            await Promise.all(
                selectedNotifications.map((id) =>
                    fetch(`http://localhost:3000/api/notifications/mark-read-or-unread/${id}`, {
                        method: "PUT",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                    }),
                ),
            );

            toast.success("Selected notifications marked as read");
            // Update UI AFTER all are marked
            setNotifications((prev) => prev.map((n) => (selectedNotifications.includes(n.notification_id) ? { ...n, is_read: true } : n)));

            setSelectedNotifications([]);
        } catch (err) {
            console.error("Bulk mark as read failed:", err);
        }
    };

    const filteredNotifications = notifications.filter((note) => note.notification_message.toLowerCase().includes(searchQuery.trim().toLowerCase()));

    const markAsReadOrUnread = async (notification_id) => {
        try {
            await fetch(`http://localhost:3000/api/notifications/mark-read-or-unread/${notification_id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            toast.success("Notification marked as read");

            // Update UI after success
            setNotifications((prev) => prev.map((n) => (n.notification_id === notification_id ? { ...n, is_read: true } : n)));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const clearAll = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/notifications/clear/${user.user_id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to clear notifications");
            }

            toast.success("All notifications cleared");

            // Clear UI instantly
            setNotifications([]);
            setSelectedNotifications([]);
        } catch (err) {
            console.error("Clear all failed:", err);
            toast.error("Failed to clear notifications");
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Header */}
            <div className="mb-8 flex w-full max-w-2xl items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-blue-900 drop-shadow-sm dark:text-white">Notifications</h1>
                    <p className="mt-2 text-base text-gray-700/80 dark:text-gray-400">
                        Stay updated with alerts and messages from{" "}
                        <span className="font-semibold text-blue-700 dark:text-blue-300">BOS Law Firm</span>
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 w-full max-w-2xl rounded-xl border bg-white/90 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
                <div className="relative flex w-full items-center">
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base text-gray-700 placeholder-gray-500 shadow-sm transition-all focus:border-blue-800 focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                    />
                    <Search
                        className="absolute left-4 text-gray-400 dark:text-gray-500"
                        size={22}
                    />
                </div>
            </div>

            {/* Notifications List */}
            <div className="w-full max-w-2xl rounded-2xl border bg-white/95 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800/95">
                {/* Select All + Bulk Actions */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedNotifications(notifications.map((n) => n.notification_id));
                                } else {
                                    setSelectedNotifications([]);
                                }
                            }}
                            className="h-5 w-5 cursor-pointer border-2 border-blue-400 accent-[#1e3a8a] shadow-sm"
                        />
                        <label className="select-none text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedNotifications.length > 0 ? `${selectedNotifications.length} selected` : "Select All"}
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={markSelectedAsReadOrUnread}
                            disabled={selectedNotifications.length === 0}
                            title={allSelectedAreRead ? "Mark as Unread" : "Mark as Read"}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow transition-all duration-150 ${
                                selectedNotifications.length === 0
                                    ? "cursor-not-allowed opacity-50 dark:text-gray-500"
                                    : allSelectedAreRead
                                      ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900"
                                      : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
                            }`}
                        >
                            {allSelectedAreRead ? <MailOpen size={18} /> : <Mail size={18} />}
                            {allSelectedAreRead ? "Mark as Unread" : "Mark as Read"}
                        </button>

                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow transition hover:bg-red-100 dark:border-red-600 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                        >
                            <Trash2 size={18} /> Clear All
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {filteredNotifications.length > 0 ? (
                    <div className="space-y-4">
                        {filteredNotifications.map((note) => {
                            const isSelected = selectedNotifications.includes(note.notification_id);
                            return (
                                <div
                                    key={note.notification_id}
                                    onClick={() => {
                                        if (!note.is_read) {
                                            markAsReadOrUnread(note.notification_id);
                                        }
                                    }}
                                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 shadow-sm transition-all duration-150 hover:scale-[1.015] hover:bg-blue-50 dark:hover:bg-blue-900/60 ${
                                        isSelected
                                            ? "border-blue-700 bg-blue-100/70 dark:bg-blue-900/40"
                                            : note.is_read
                                              ? "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                                              : "border-blue-200 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/40"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setSelectedNotifications((prev) =>
                                                checked ? [...prev, note.notification_id] : prev.filter((id) => id !== note.notification_id),
                                            );
                                        }}
                                        className="mt-1 h-5 w-5 cursor-pointer border-2 border-blue-400 accent-[#1e3a8a] shadow-sm"
                                    />

                                    {/* Message + Timestamp */}
                                    <div className="flex flex-1 items-start justify-between">
                                        <div>
                                            <p
                                                className={`text-base leading-snug ${
                                                    note.is_read ? "text-gray-900 dark:text-slate-300" : "font-bold text-[#1e3a8a] dark:text-white"
                                                }`}
                                            >
                                                {note.notification_message}
                                            </p>
                                        </div>
                                        <div className="ml-6 flex-shrink-0 text-right">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                {new Date(note.date_created).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <MailOpen
                            size={48}
                            className="mb-4 text-blue-300 dark:text-blue-700"
                        />
                        <div className="text-lg font-semibold text-gray-500 dark:text-gray-400">No notifications available</div>
                        <div className="mt-2 text-sm text-gray-400 dark:text-gray-600">You're all caught up!</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
