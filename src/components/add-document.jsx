// Modal for adding a supporting document to a case

import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context.jsx";
import api from "@/utils/api";
import toast from "react-hot-toast";
import Spinner from "./loading.jsx";

export default function AddDocument({ caseId, onClose, onAdded }) {
    const { user } = useAuth() || {};

    const [docs, setDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");

    // Form state
    const [form, setForm] = useState({
        doc_name: "",
        doc_description: "",
        doc_tag: "",
        doc_password: "",
        doc_type: "Support", // keep consistent with backend
        case_id: caseId,
    });

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        // File size limiting
        if (selected.size > 10 * 1024 * 1024) {
            setFileError("File size must be 10MB or less.");
            setFile(null);
            e.target.value = null;
            return;
        }

        setFile(selected);
        setFileError("");
    };

    const removeFile = () => {
        setFile(null);
        setFileError("");
    };

    const fetchDocuments = async () => {
        if (!caseId) return;
        setLoadingDocs(true);
        setError("");
        try {
            const data = await api.get(`/case/documents/${caseId}`);
            setDocs(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load documents");
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [caseId]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const toastId = toast.loading("Submitting...", { duration: 10000 });

        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k !== "case_id" && v !== undefined && v !== null) fd.append(k, v);
            });
            if (user?.user_id) fd.append("doc_submitted_by", user.user_id);
            fd.append("case_id", caseId);

            // only one file
            if (file) fd.append("doc_file", file);

            await api.post("/documents", fd);

            toast.success("Document added successfully", { id: toastId, duration: 4000 });

            setForm({
                doc_name: "",
                doc_description: "",
                doc_tag: "",
                doc_password: "",
                doc_type: "Support",
                case_id: caseId,
            });
            setFile(null);
            fetchDocuments();
            if (onAdded) onAdded();
        } catch (e) {
            setError(e.message || "Submission failed");
            toast.error("Submission failed", { id: toastId, duration: 4000 });
            console.error("Add document error:", e);
            setSubmitting(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-lg dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Document (Support Document)</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 p-4">
                    {error && <p className="text-red-600">{error}</p>}

                    <form
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* Document Name */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium">Document Name</label>
                                <input
                                    name="doc_name"
                                    value={form.doc_name}
                                    onChange={onChange}
                                    type="text"
                                    required
                                    placeholder="e.g. Affidavit"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            {/* Tag */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium">Tag</label>
                                <input
                                    name="doc_tag"
                                    value={form.doc_tag}
                                    onChange={onChange}
                                    type="text"
                                    placeholder="e.g. evidence, draft"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            {/* Password (optional) */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password (optional)</label>
                                <input
                                    name="doc_password"
                                    value={form.doc_password}
                                    onChange={onChange}
                                    type="password"
                                    placeholder="Set a password if needed"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <label className="mb-1 text-sm font-medium">Description</label>
                            <textarea
                                name="doc_description"
                                value={form.doc_description}
                                onChange={onChange}
                                rows={2}
                                placeholder="Enter a detailed description..."
                                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-slate-800"
                            />
                        </div>

                        {/* File Reference */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium">Attached File (PDF)</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                            />
                            {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
                            {file && (
                                <div className="mt-2 flex items-center justify-between rounded border px-2 py-1 text-sm dark:border-gray-600">
                                    <span>📄 {file.name}</span>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        ❌
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {submitting ? (
                                    <>
                                        Adding Document... <Spinner />
                                    </>
                                ) : (
                                    "Add Document"
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Existing Documents */}
                    <div className="mt-6 overflow-x-auto">
                        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Existing Documents for this Case</h3>
                        {loadingDocs ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : docs.length === 0 ? (
                            <p className="text-sm text-gray-500">No documents found.</p>
                        ) : (
                            <table className="min-w-full border text-sm dark:border-gray-600">
                                <thead className="bg-gray-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="border p-2 text-left">Name</th>
                                        <th className="border p-2 text-left">Tag</th>
                                        <th className="border p-2 text-left">File</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {docs.map((d) => (
                                        <tr
                                            key={d.doc_id}
                                            className="odd:bg-white even:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-800"
                                        >
                                            <td className="border p-2">{d.doc_name}</td>
                                            <td className="border p-2">{d.doc_tag || "-"}</td>
                                            <td className="border p-2">
                                                {d.doc_file ? (
                                                    <a
                                                        className="text-blue-600 hover:underline"
                                                        href={`${api.baseUrl.replace(/\/api$/, '')}${d.doc_file}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
