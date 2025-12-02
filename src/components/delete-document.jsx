import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const DeleteDocumentModal = ({ doc, onClose, onDeleted }) => {
    const [submitting, setSubmitting] = useState(false);
    if (!doc) return null;

    const handleConfirm = async () => {
        setSubmitting(true);
        const toastId = toast.loading("Deleting document...", { duration: 4000 });
        try {
            const res = await fetch(`http://localhost:3000/api/documents/${doc.doc_id}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || "Failed to delete document");
            }
            toast.success("Document deleted", { id: toastId, duration: 3000 });
            if (onDeleted) onDeleted();
        } catch (err) {
            console.error("Delete document failed", err);
            toast.error(err.message || "Delete failed", { id: toastId, duration: 4000 });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </button>

                <h2 className="mb-4 text-xl font-semibold">Delete Document</h2>
                <p className="mb-6">Are you sure you want to permanently delete Document {doc.doc_id}? This action cannot be undone.</p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {submitting ? "Deleting..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteDocumentModal;
