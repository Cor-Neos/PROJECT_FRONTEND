import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

export default function EditDocument({ doc, users = [], onClose, onSaved }) {
    const { user } = useAuth();

    if (!doc) return null;

    const isTask = doc.doc_type === "Task";

    // Shared submit handler (branches by type)
    const [submitting, setSubmitting] = useState(false);

    // Task state and helpers
    const [showDropdown, setShowDropdown] = useState(false);
    const prioToDays = { Low: 14, Mid: 5, High: 2 };
    const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };
    const formatTimestamp = (d) => {
        const pad2 = (n) => String(n).padStart(2, "0");
        const date = formatDate(d);
        const h = pad2(d.getHours());
        const mi = pad2(d.getMinutes());
        const s = pad2(d.getSeconds());
        const micros = String(d.getMilliseconds() * 1000).padStart(6, "0");
        return `${date} ${h}:${mi}:${s}.${micros}`;
    };

    // Initialize form state per type
    const [taskForm, setTaskForm] = useState({
        doc_name: doc.doc_name || "",
        doc_description: doc.doc_description || "",
        doc_task: doc.doc_task || "",
        doc_prio_level: doc.doc_prio_level || "",
        doc_due_date: doc.doc_due_date || "",
        doc_tag: doc.doc_tag || "",
        doc_password: "",
        doc_tasked_to: doc.doc_tasked_to || "",
        doc_tasked_by: doc.doc_tasked_by || user?.user_id || "",
        doc_type: "Task",
        doc_status: doc.doc_status || "todo",
        case_id: doc.case_id,
        doc_last_updated_by: user.user_id,
    });

    const [supportForm, setSupportForm] = useState({
        doc_name: doc.doc_name || "",
        doc_description: doc.doc_description || "",
        doc_tag: doc.doc_tag || "",
        doc_password: "",
        doc_type: "Support",
        case_id: doc.case_id,
        doc_last_updated_by: user.user_id,
    });

    // local file state for optional replacement
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");

    const onTaskChange = (e) => {
        const { name, value } = e.target;
        setTaskForm((prev) => ({ ...prev, [name]: value }));
    };
    const onSupportChange = (e) => {
        const { name, value } = e.target;
        setSupportForm((prev) => ({ ...prev, [name]: value }));
    };

    const onPriorityChange = (e) => {
        const value = e.target.value;
        const days = prioToDays[value];
        let due = taskForm.doc_due_date || "";
        if (days) {
            const dt = new Date();
            dt.setDate(dt.getDate() + days);
            dt.setHours(23, 59, 59, 999);
            due = formatTimestamp(dt);
        }
        setTaskForm((prev) => ({ ...prev, doc_prio_level: value, doc_due_date: due }));
    };

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (selected.size > 10 * 1024 * 1024) {
            setFileError("File size must be 10MB or less.");
            setFile(null);
            e.target.value = null;
            return;
        }
        if (selected.type !== "application/pdf") {
            setFileError("Only PDF files are allowed.");
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

    const submitTask = async () => {
        const toastId = toast.loading("Saving changes...", { duration: 4000 });
        try {
            // If replacing file, use multipart; else JSON
            let res;
            if (file) {
                const fd = new FormData();
                Object.entries(taskForm).forEach(([k, v]) => {
                    if (v !== undefined && v !== null) fd.append(k, v);
                });
                fd.append("doc_file", file);
                res = await fetch(`http://localhost:3000/api/documents/${doc.doc_id}`, {
                    method: "PUT",
                    credentials: "include",
                    body: fd,
                });
            } else {
                const payload = { ...taskForm };
                if (!payload.doc_password) delete payload.doc_password;
                res = await fetch(`http://localhost:3000/api/documents/${doc.doc_id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || data.message || "Failed to update document");

            toast.success("Task document updated", { id: toastId, duration: 3000 });
            if (onSaved) onSaved();
        } catch (err) {
            console.error("Update task document failed", err);
            toast.error(err.message || "Update failed", { id: toastId, duration: 4000 });
        }
    };

    const submitSupport = async () => {
        const toastId = toast.loading("Saving changes...", { duration: 4000 });
        try {
            let res;
            if (file) {
                const fd = new FormData();
                Object.entries(supportForm).forEach(([k, v]) => {
                    if (v !== undefined && v !== null) fd.append(k, v);
                });
                if (user?.user_id) fd.append("doc_submitted_by", user.user_id);
                fd.append("doc_file", file);
                res = await fetch(`http://localhost:3000/api/documents/${doc.doc_id}`, {
                    method: "PUT",
                    credentials: "include",
                    body: fd,
                });
            } else {
                const payload = { ...supportForm };
                if (!payload.doc_password) delete payload.doc_password;
                if (user?.user_id) payload.doc_submitted_by = user.user_id;
                res = await fetch(`http://localhost:3000/api/documents/${doc.doc_id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || data.message || "Failed to update document");

            toast.success("Document updated", { id: toastId, duration: 4000 });
            if (onSaved) onSaved();
        } catch (err) {
            console.error("Update support document failed", err);
            toast.error(err.message || "Update failed", { id: toastId, duration: 4000 });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isTask) await submitTask();
            else await submitSupport();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
                <button
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </button>
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {isTask ? "Edit Task Document" : "Edit Document (Support)"}
                </h2>

                {isTask ? (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="relative flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tasked To <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowDropdown((p) => !p)}
                                        className="flex w-full items-center justify-between rounded border px-3 py-2 text-left dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                    >
                                        {taskForm.doc_tasked_to
                                            ? (() => {
                                                const selected = users.find((u) => u.user_id === taskForm.doc_tasked_to) || {};
                                                return (
                                                    <span>
                                                        {selected.user_fname || ""} {selected.user_mname ? selected.user_mname[0] + ". " : ""}
                                                        {selected.user_lname || ""}
                                                        {selected.user_role && (
                                                            <span
                                                                className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${selected.user_role === "Paralegal" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                                                            >
                                                                {selected.user_role}
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            })()
                                            : "Select Staff / Paralegal"}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="ml-2 h-4 w-4 opacity-70"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {showDropdown && (
                                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border bg-white shadow dark:border-gray-600 dark:bg-slate-800">
                                            {users
                                                .filter((u) => u.user_role === "Paralegal" || u.user_role === "Staff")
                                                .map((u) => (
                                                    <div
                                                        key={u.user_id}
                                                        onClick={() => {
                                                            setTaskForm((prev) => ({ ...prev, doc_tasked_to: u.user_id }));
                                                            setShowDropdown(false);
                                                        }}
                                                        className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700"
                                                    >
                                                        <span className="text-gray-800 dark:text-gray-100">
                                                            {u.user_fname} {u.user_mname ? u.user_mname[0] + ". " : ""}
                                                            {u.user_lname}
                                                        </span>
                                                        <span
                                                            className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${u.user_role === "Paralegal" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                                                        >
                                                            {u.user_role}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Document Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="doc_name"
                                    value={taskForm.doc_name}
                                    onChange={onTaskChange}
                                    type="text"
                                    required
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Priority Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="doc_prio_level"
                                    value={taskForm.doc_prio_level}
                                    onChange={onPriorityChange}
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                    required
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Select priority
                                    </option>
                                    <option value="Low">Low</option>
                                    <option value="Mid">Mid</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Due Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="doc_due_date"
                                    value={taskForm.doc_due_date ? String(taskForm.doc_due_date).slice(0, 10) : ""}
                                    type="date"
                                    readOnly
                                    required
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tag <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="doc_tag"
                                    value={taskForm.doc_tag}
                                    onChange={onTaskChange}
                                    type="text"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input
                                    name="doc_password"
                                    value={taskForm.doc_password}
                                    onChange={onTaskChange}
                                    type="password"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Replace file */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Replace Attached File (PDF)</label>
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
                                    <button type="button" onClick={removeFile} className="ml-2 text-red-500 hover:text-red-700">❌</button>
                                </div>
                            )}
                            {!file && doc.doc_file && (
                                <p className="mt-1 text-sm">
                                    Current file: {" "}
                                    <a className="text-blue-600 hover:underline" href={`http://localhost:3000${doc.doc_file}`} target="_blank" rel="noreferrer">View</a>
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Task Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="doc_task"
                                value={taskForm.doc_task}
                                onChange={onTaskChange}
                                rows={3}
                                className="w-full resize-none rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium">
                                    Document Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="doc_name"
                                    value={supportForm.doc_name}
                                    onChange={onSupportChange}
                                    type="text"
                                    required
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium">
                                    Tag <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="doc_tag"
                                    value={supportForm.doc_tag}
                                    onChange={onSupportChange}
                                    type="text"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password (optional)</label>
                                <input
                                    name="doc_password"
                                    value={supportForm.doc_password}
                                    onChange={onSupportChange}
                                    type="password"
                                    className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Replace file for Support */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium">Replace Attached File (PDF)</label>
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
                                    <button type="button" onClick={removeFile} className="ml-2 text-red-500 hover:text-red-700">❌</button>
                                </div>
                            )}
                            {!file && doc.doc_file && (
                                <p className="mt-1 text-sm">
                                    Current file: {" "}
                                    <a className="text-blue-600 hover:underline" href={`http://localhost:3000${doc.doc_file}`} target="_blank" rel="noreferrer">View</a>
                                </p>
                            )}
                        </div>

                        <div className="col-span-2">
                            <label className="mb-1 text-sm font-medium">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="doc_description"
                                value={supportForm.doc_description}
                                onChange={onSupportChange}
                                rows={2}
                                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-slate-800"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}