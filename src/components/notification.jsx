import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Mail, MailOpen, X, Search, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null); // 🔹 For modal
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const allSelected = notifications.length > 0 && selectedNotifications.length === notifications.length;
  const allSelectedAreRead = notifications.filter((n) => selectedNotifications.includes(n.notification_id)).every((n) => n.is_read);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const toggleSelectedReadStatus = () => {
    setNotifications((prev) => prev.map((n) => (selectedNotifications.includes(n.notification_id) ? { ...n, is_read: !n.is_read } : n)));
  };

  const toggleSingleRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.notification_id === id ? { ...n, is_read: !n.is_read } : n)));
    if (selectedNotification?.notification_id === id) {
      setSelectedNotification((prev) => (prev ? { ...prev, is_read: !prev.is_read } : prev));
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setSelectedNotifications([]);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setShowUnreadOnly(false);
  };

  const filteredNotifications = notifications
    .filter((note) => note.notification_message?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .filter((n) => (showUnreadOnly ? !n.is_read : true));

  return (
    <div className="min-h-screen w-full bg-transparent p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Notifications</h1>
            <p className="mt-1 text-sm text-gray-700/80 dark:text-gray-400">
              Stay updated with alerts and messages from BOS Law Firm
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              {unreadCount} unread
            </span>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${unreadCount === 0
                  ? "cursor-not-allowed opacity-50 dark:text-gray-500"
                  : "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-slate-600 dark:text-blue-400 dark:hover:bg-slate-700"
                }`}
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="relative flex w-full items-center">
            <Search className="pointer-events-none absolute left-3 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-base text-gray-700 placeholder-gray-500 shadow-sm focus:border-blue-800 focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setShowUnreadOnly(false)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${!showUnreadOnly
                  ? "bg-blue-600 text-white shadow"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
            >
              All
            </button>
            <button
              onClick={() => setShowUnreadOnly(true)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${showUnreadOnly
                  ? "bg-blue-600 text-white shadow"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
            >
              Unread
            </button>
            {(showUnreadOnly || searchQuery) && (
              <button
                onClick={clearFilters}
                className="ml-1 rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* Select All + Bulk Actions */}
          <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${selectedNotifications.length === 0
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

          {/* Loading state */}
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-start gap-3 rounded-xl border p-4 dark:border-slate-700">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-slate-700" />
                    <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notifications */}
          {!loading && (filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((note) => {
                const isSelected = selectedNotifications.includes(note.notification_id);
                const isUnread = !note.is_read;
                return (
                  <div
                    key={note.notification_id}
                    onClick={() => setSelectedNotification(note)}
                    className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:-translate-y-[1px] hover:shadow-sm ${isSelected
                        ? "border-blue-700 bg-blue-50/70 dark:bg-blue-900/30"
                        : isUnread
                          ? "border-blue-200 bg-blue-50/60 dark:border-slate-700 dark:bg-slate-700/60"
                          : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
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

                    {/* Leading avatar/icon */}
                    <div className="relative mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm ring-2 ring-blue-200 group-hover:ring-blue-300 dark:border-slate-700 dark:ring-blue-900">
                      {note.is_read ? <MailOpen size={18} /> : <Mail size={18} />}
                      {!note.is_read && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-800" />
                      )}
                    </div>

                    {/* Message + Timestamp */}
                    <div className="flex flex-1 items-start justify-between">
                      <div className="pr-3">
                        <p
                          className={`text-[15px] leading-snug ${note.is_read ? "text-gray-900 dark:text-slate-300" : "font-semibold text-[#1e3a8a] dark:text-white"
                            }`}
                        >
                          {note.notification_message}
                        </p>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                            {new Date(note.date_created).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSingleRead(note.notification_id);
                            }}
                            className="text-xs text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                          >
                            {note.is_read ? "Mark as unread" : "Mark as read"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-300">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 dark:text-white">No notifications</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You're all caught up for now.</p>
              </div>
              {(showUnreadOnly || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="mt-1 rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  {selectedNotification.is_read ? <MailOpen size={18} /> : <Mail size={18} />}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {new Date(selectedNotification.date_created).toLocaleString("en-US", {
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
              <button
                aria-label="Close"
                onClick={() => setSelectedNotification(null)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-[15px] leading-relaxed text-gray-900 dark:text-slate-200">
                {selectedNotification.notification_message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => toggleSingleRead(selectedNotification.notification_id)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700"
              >
                {selectedNotification.is_read ? "Mark as unread" : "Mark as read"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;