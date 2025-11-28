import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import api from "@/utils/api";

const RejectDocumentModal = ({ doc, onClose, onRejected }) => {
    const { user } = useAuth() || {};
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!doc) return null;

    const handleConfirm = async () => {
        setSubmitting(true);
        const toastId = toast.loading("Rejecting document...", { duration: 4000 });
        try {
            const payload = {
                doc_status: "todo",
                doc_tag: "Rejected: " + reason,
            };

            await api.put(`/documents/${doc.doc_id}`, payload);

            toast.success("Document rejected", { id: toastId, duration: 3000 });
            if (onRejected) onRejected();
        } catch (err) {
            console.error("Reject document failed", err);
            toast.error(err.message || "Reject failed", { id: toastId, duration: 4000 });
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

                <h2 className="mb-4 text-xl font-semibold">Reject Document</h2>
                <p className="mb-6">
                    Are you sure you want to <strong>reject</strong> Document {doc.doc_id}? This action cannot be undone.
                </p>

                <div className="mb-6">
                    <label
                        className="mb-2 block text-sm"
                        htmlFor="reject-reason"
                    >
                        Reason (optional)
                    </label>
                    <textarea
                        id="reject-reason"
                        className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:focus:border-blue-400"
                        rows={3}
                        placeholder="Enter a reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

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
                        className={`rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60`}
                    >
                        {submitting ? "Rejecting..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectDocumentModal;
