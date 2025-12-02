import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, File, CreditCard, CheckSquare, Calendar, User, ArrowLeft, Search } from "lucide-react";
import { useAuth } from "../../context/auth-context.jsx";
import toast from "react-hot-toast";
import Spinner from "../../components/loading.jsx";

const API_BASE = "http://localhost:3000/api";

// This file component is the Trash in the SIDEBAR 
// PUSH FOR JOSEPH's BRANCH UPDATE

export default function RecentlyDeleted({ onClose }) {
    const { user } = useAuth() || {};
    const [activeTab, setActiveTab] = useState("documents");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Data states for each tab
    const [deletedDocuments, setDeletedDocuments] = useState([]);
    const [deletedPayments, setDeletedPayments] = useState([]);
    const [deletedTasks, setDeletedTasks] = useState([]);

    // Tab configuration
    const tabs = [
        {
            id: "documents",
            label: "Documents",
            icon: File,
            count: deletedDocuments.length,
        },
        // {
        //     id: "tasks",
        //     label: "Tasks",
        //     icon: CheckSquare,
        //     count: deletedTasks.length,
        // },
        // Uncomment below to enable payments
        // {
        //     id: "payments",
        //     label: "Payments",
        //     icon: CreditCard,
        //     count: deletedPayments.length
        // },
    ];

    // Fetch all deleted items when component loads
    useEffect(() => {
        fetchAllDeletedItems();
    }, []);

    const fetchAllDeletedItems = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            // Fetch all items simultaneously - using existing endpoints
            const [documentsResponse, paymentsResponse, tasksResponse] = await Promise.all([
                fetch(`${API_BASE}/documents`, { headers }).catch(() => ({ ok: false, status: 500 })),
                fetch(`${API_BASE}/payments`, { headers }).catch(() => ({ ok: false, status: 500 })),
                fetch(`${API_BASE}/tasks`, { headers }).catch(() => ({ ok: false, status: 500 })),
            ]);

            // Documents
            if (documentsResponse.ok) {
                const documentsData = await documentsResponse.json();
                const docsArr = Array.isArray(documentsData) ? documentsData : documentsData.documents || documentsData || [];
                // Only filter by is_deleted for trash
                const deletedDocs = docsArr.filter((doc) => doc.is_deleted === true).map((doc) => ({ ...doc, id: doc.id || doc.doc_id }));
                setDeletedDocuments(deletedDocs);
            } else {
                setDeletedDocuments([]);
            }

            // Payments
            if (paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                const paysArr = Array.isArray(paymentsData) ? paymentsData : paymentsData.payments || paymentsData || [];
                const deletedPays = paysArr.filter(
                    (payment) => payment.payment_status === "deleted" || payment.status === "deleted" || payment.is_deleted === true,
                );
                setDeletedPayments(deletedPays);
            } else {
                setDeletedPayments([]);
            }

            // Tasks
            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                const tasksArr = Array.isArray(tasksData) ? tasksData : tasksData.tasks || tasksData || [];
                const deletedTasks = tasksArr.filter(
                    (task) => task.task_status === "deleted" || task.status === "deleted" || task.is_deleted === true,
                );
                setDeletedTasks(deletedTasks);
            } else {
                setDeletedTasks([]);
            }
        } catch (err) {
            setError("Failed to fetch items: " + err.message);
            setDeletedDocuments([]);
            setDeletedPayments([]);
            setDeletedTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (itemId, itemType) => {
        try {
            const token = localStorage.getItem("token");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            await fetch(`${API_BASE}/${itemType}/${itemId}/restore`, {
                method: "PATCH",
                headers,
            });

            toast.success(`${itemType.slice(0, -1)} restored successfully`);
            fetchAllDeletedItems(); // Refresh all data
        } catch (err) {
            toast.error("Failed to restore item");
            console.error("Error restoring item:", err);
        }
    };

    const handlePermanentDelete = async (itemId, itemType) => {
        if (!window.confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            await fetch(`${API_BASE}/${itemType}/${itemId}/permanent`, {
                method: "DELETE",
                headers,
            });

            toast.success(`${itemType.slice(0, -1)} permanently deleted`);
            fetchAllDeletedItems(); // Refresh all data
        } catch (err) {
            toast.error("Failed to delete item permanently");
            console.error("Error permanently deleting item:", err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Helper to calculate days left before auto-delete
    const getDaysLeft = (deletedDate) => {
        if (!deletedDate) return null;
        const deleted = new Date(deletedDate);
        const now = new Date();
        const diff = 30 - Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const getCurrentData = () => {
        let data = [];
        switch (activeTab) {
            case "documents":
                data = deletedDocuments;
                break;
            case "payments":
                data = deletedPayments;
                break;
            case "tasks":
                data = deletedTasks;
                break;
            default:
                data = [];
        }

        // Filter by search term
        if (searchTerm) {
            return data.filter((item) => {
                const searchLower = searchTerm.toLowerCase();
                if (activeTab === "documents") {
                    return (
                        item.doc_name?.toLowerCase().includes(searchLower) ||
                        item.doc_type?.toLowerCase().includes(searchLower) ||
                        item.case_name?.toLowerCase().includes(searchLower)
                    );
                } else if (activeTab === "payments") {
                    return (
                        item.client_name?.toLowerCase().includes(searchLower) ||
                        item.case_name?.toLowerCase().includes(searchLower) ||
                        item.payment_method?.toLowerCase().includes(searchLower)
                    );
                } else if (activeTab === "tasks") {
                    return (
                        item.task_name?.toLowerCase().includes(searchLower) ||
                        item.assigned_to?.toLowerCase().includes(searchLower) ||
                        item.case_name?.toLowerCase().includes(searchLower)
                    );
                }
                return false;
            });
        }

        return data;
    };

    // Pagination state for load more
    const [visibleCount, setVisibleCount] = useState(4);

    // Reset visibleCount when tab or search changes
    useEffect(() => {
        setVisibleCount(4);
    }, [activeTab, searchTerm]);

    // Helper to get paginated data
    const getPaginatedData = () => {
        return getCurrentData().slice(0, visibleCount);
    };

    // --- ADVANCED UI POLISH START ---
    // Add a section header for each tab, with icon and description
    // Add a fade-in animation for cards
    // Add a tooltip for action buttons
    // Add a badge for days left before permanent deletion
    // Add a divider between cards
    // Use a soft blue background for the main area
    // --- ADVANCED UI POLISH END ---
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="rounded p-2 transition-colors hover:bg-blue-50 focus:outline-none dark:hover:bg-gray-800"
                                title="Back"
                            ></button>
                            <Trash2 className="h-6 w-6 text-red-500" />
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recently Deleted</h1>
                        </div>
                        {/* Search Bar */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="mb-6 flex space-x-4 border-b border-gray-200 dark:border-gray-800">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 border-b-2 px-2 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? "border-blue-500 text-blue-600 dark:text-blue-300"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    }`}
                                title={tab.label}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="ml-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-gray-800 dark:text-blue-200">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Section Header */}
                <div className="mb-4 mt-2 flex items-center gap-2">
                    {activeTab === "documents" && <File className="h-5 w-5 text-blue-400" />}
                    {activeTab === "tasks" && <CheckSquare className="h-5 w-5 text-orange-400" />}
                    <span className="text-lg font-semibold capitalize text-gray-700 dark:text-gray-200">{activeTab}</span>
                    <span className="text-xs text-gray-400">({getCurrentData().length} deleted)</span>
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Spinner />
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deleted {activeTab}...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="mb-4 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                                <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
                            <button
                                onClick={fetchAllDeletedItems}
                                className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : getCurrentData().length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="mb-6 rounded-full bg-blue-50 p-6 dark:bg-gray-800">
                                <Trash2 className="h-12 w-12 text-blue-300 dark:text-gray-500" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No deleted {activeTab} found</h3>
                            <p className="max-w-md text-center text-gray-500 dark:text-gray-400">
                                {searchTerm
                                    ? `No deleted ${activeTab} match your search criteria.`
                                    : `You don't have any deleted ${activeTab} to restore.`}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-4 text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                {activeTab === "documents" &&
                                    getPaginatedData().map((doc, idx, arr) => (
                                        <React.Fragment key={doc.id}>
                                            <div className="animate-fadeIn flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <File className="h-8 w-8 text-blue-400" />
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{doc.doc_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {doc.doc_type} • {doc.case_name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Deleted by {doc.deleted_by} on {formatDate(doc.deleted_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex min-w-[120px] flex-col items-end gap-2">
                                                    <span
                                                        className="mb-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        title="Days left before permanent deletion"
                                                    >
                                                        {getDaysLeft(doc.deleted_date)} days left
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRestore(doc.id, "documents")}
                                                            className="rounded bg-green-500 px-3 py-1.5 text-xs text-white shadow transition-all duration-150 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                                                            title="Restore this document"
                                                        >
                                                            Restore
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(doc.id, "documents")}
                                                            className="rounded bg-red-500 px-3 py-1.5 text-xs text-white shadow transition-all duration-150 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                                                            title="Permanently delete this document"
                                                        >
                                                            Delete Permanently
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {idx < arr.length - 1 && <div className="mx-2 border-t border-gray-100 dark:border-gray-800" />}
                                        </React.Fragment>
                                    ))}
                                {activeTab === "tasks" &&
                                    getPaginatedData().map((task, idx, arr) => (
                                        <React.Fragment key={task.id}>
                                            <div className="animate-fadeIn flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <CheckSquare className="h-8 w-8 text-orange-400" />
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{task.task_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {task.assigned_to} • {task.case_name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Deleted by {task.deleted_by} on {formatDate(task.deleted_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex min-w-[120px] flex-col items-end gap-2">
                                                    <span
                                                        className="mb-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        title="Days left before permanent deletion"
                                                    >
                                                        {getDaysLeft(task.deleted_date)} days left
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRestore(task.id, "tasks")}
                                                            className="rounded bg-green-500 px-3 py-1.5 text-xs text-white shadow transition-all duration-150 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                                                            title="Restore this task"
                                                        >
                                                            Restore
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(task.id, "tasks")}
                                                            className="rounded bg-red-500 px-3 py-1.5 text-xs text-white shadow transition-all duration-150 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                                                            title="Permanently delete this task"
                                                        >
                                                            Delete Permanently
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {idx < arr.length - 1 && <div className="mx-2 border-t border-gray-100 dark:border-gray-800" />}
                                        </React.Fragment>
                                    ))}
                            </div>
                            {getCurrentData().length > visibleCount && (
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => setVisibleCount((c) => c + 4)}
                                        className="rounded-lg text-blue-600 underline hover:underline dark:text-blue-400"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 rounded border border-yellow-100 bg-yellow-50 px-3 py-1.5 dark:border-yellow-900 dark:bg-yellow-900/20">
                        <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">Items are automatically permanently deleted after 30 days</p>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease; }
            `}</style>
        </div>
    );
}