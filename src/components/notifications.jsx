import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Mail, MailOpen, X, Search, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import api from "../utils/api";

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNotification, setSelectedNotification] = useState(null); // 🔹 For modal

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const data = await api.get(`/notifications/${user.user_id}`);
            setNotifications(Array.isArray(data) ? data : []);
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

    const toggleSelectedReadStatus = () => {
        setNotifications((prev) => prev.map((n) => (selectedNotifications.includes(n.notification_id) ? { ...n, is_read: !n.is_read } : n)));
    };

    const clearAll = () => {
        setNotifications([]);
        setSelectedNotifications([]);
    };

    const filteredNotifications = notifications.filter((note) => note.notification_message.toLowerCase().includes(searchQuery.trim().toLowerCase()));

    return (
        <div className="min-h-screen w-full bg-transparent p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Notifications</h1>
                    <p className="mt-1 text-sm text-gray-700/80 dark:text-gray-400">Stay updated with alerts and messages from BOS Law Firm</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="relative flex w-full items-center">
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-base text-gray-700 placeholder-gray-500 shadow-sm focus:border-blue-800 focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                    />
                    <Search
                        className="absolute left-3 text-gray-400 dark:text-gray-500"
                        size={20}
                    />
                </div>
            </div>

            {/* Notifications List */}
            <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {/* Select All + Bulk Actions */}
                <div className="mb-4 flex flex-col items-start gap-3">
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
                            className="h-5 w-5 cursor-pointer accent-[#1e3a8a]"
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedNotifications.length > 0 ? `${selectedNotifications.length} selected` : "Select All"}
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSelectedReadStatus}
                            disabled={selectedNotifications.length === 0}
                            title={allSelectedAreRead ? "Mark as Unread" : "Mark as Read"}
                            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                                selectedNotifications.length === 0
                                    ? "cursor-not-allowed opacity-50 dark:text-gray-500"
                                    : "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-slate-600 dark:text-blue-400 dark:hover:bg-slate-700"
                            }`}
                        >
                            {allSelectedAreRead ? <MailOpen size={16} /> : <Mail size={16} />}
                            {allSelectedAreRead ? "Mark as Unread" : "Mark as Read"}
                        </button>

                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                            <Trash2 size={16} /> Clear All
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {filteredNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {filteredNotifications.map((note) => {
                            const isSelected = selectedNotifications.includes(note.notification_id);
                            return (
                                <div
                                    key={note.notification_id}
                                    onClick={() => setSelectedNotification(note)}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:scale-[1.01] hover:bg-blue-50 dark:hover:bg-blue-900 ${
                                        isSelected
                                            ? "border-blue-700 bg-blue-100/60 dark:bg-blue-900/40"
                                            : note.is_read
                                              ? "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                                              : "bg-blue-50 dark:bg-slate-700"
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
                                        className="mt-1 h-5 w-5 cursor-pointer accent-[#1e3a8a]"
                                    />

                                    {/* Message + Timestamp */}
                                    <div className="flex flex-1 items-start justify-between">
                                        <div>
                                            <p
                                                className={`text-sm ${
                                                    note.is_read
                                                        ? "text-gray-900 dark:text-slate-300"
                                                        : "font-semibold text-[#1e3a8a] dark:text-white"
                                                }`}
                                            >
                                                {note.notification_message}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    <div className="py-6 text-center text-gray-500 dark:text-gray-400">No notifications available</div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
