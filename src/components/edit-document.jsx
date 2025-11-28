import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import api from "../utils/api";

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
        doc_reference: doc.doc_reference || [],
    });

    const [supportForm, setSupportForm] = useState({
        doc_name: doc.doc_name || "",
        doc_description: doc.doc_description || "",
        doc_tag: doc.doc_tag || "",
        doc_password: "",
        doc_type: "Support",
        case_id: doc.case_id,
        doc_last_updated_by: user.user_id,
        doc_file: doc.doc_file || "",
    });

    // --- New: File handling state ---
    // Task references: keep existing reference URLs and allow adding new PDF files
    const [existingRefs, setExistingRefs] = useState([]);
    const [newRefFiles, setNewRefFiles] = useState([]); // File[]
    const [refFileError, setRefFileError] = useState("");

    // Support single main file replacement
    const [newMainFile, setNewMainFile] = useState(null); // File | null
    const [mainFileError, setMainFileError] = useState("");

    useEffect(() => {
        // Parse doc_reference which may be JSON string or array
        let refs = [];
        if (doc.doc_reference) {
            try {
                if (typeof doc.doc_reference === "string") {
                    const parsed = JSON.parse(doc.doc_reference);
                    if (Array.isArray(parsed)) refs = parsed;
                } else if (Array.isArray(doc.doc_reference)) {
                    refs = doc.doc_reference;
                }
            } catch (e) {
                console.error("Failed to parse doc_reference", e);
            }
        }
        setExistingRefs(refs);
    }, [doc.doc_reference]);

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

    // --- New: file handlers ---
    const onAddRefFiles = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const oversized = files.some((f) => f.size > 10 * 1024 * 1024);
        if (oversized) {
            setRefFileError("Each file must be 10MB or less.");
            e.target.value = null;
            return;
        }
        setNewRefFiles((prev) => [...prev, ...files]);
        setRefFileError("");
        e.target.value = null;
    };

    const removeNewRefAt = (idx) => {
        setNewRefFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    // Actual removal of existing reference
    const removeExistingRefAt = async (idx) => {
        const onConfirm = window.confirm("Are you sure you want to remove this reference file from the document?");
        if (!onConfirm) return;

        if (onConfirm) {
            const toastId = toast.loading("Removing file reference...", { duration: 3000 });
            try {
                const refToRemove = existingRefs[idx];
                setExistingRefs((prev) => prev.filter((_, i) => i !== idx));

                // Make backend call
                await api.put(`/documents/${doc.doc_id}/remove-reference`, {
                    referencePath: refToRemove,
                });

                console.log("refToRemove", refToRemove, typeof refToRemove);

                toast.success("Reference removed successfully", { id: toastId, duration: 3000 });
            } catch (err) {
                console.error("Failed to remove reference", err);
                toast.error(err.message || "Failed to remove reference", { id: toastId, duration: 3000 });
            }
        }
    };

    const onMainFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) {
            setMainFileError("File size must be 10MB or less.");
            e.target.value = null;
            return;
        }
        setNewMainFile(f);
        setMainFileError("");
    };
    const clearMainFile = () => setNewMainFile(null);

    const submitTask = async () => {
        const toastId = toast.loading("Saving changes...", { duration: 4000 });
        try {
            // Always use FormData so we can support files and normal fields
            const fd = new FormData();
            Object.entries(taskForm).forEach(([k, v]) => {
                if (v !== undefined && v !== null) fd.append(k, v);
            });
            // Keep list for existing references after removals
            fd.append("doc_reference", JSON.stringify(existingRefs));
            // Newly added reference files
            newRefFiles.forEach((f) => fd.append("doc_reference", f));

            await api.put(`/documents/${doc.doc_id}`, fd);

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
            // Use FormData to support optional main file replacement
            const fd = new FormData();
            Object.entries(supportForm).forEach(([k, v]) => {
                if (v !== undefined && v !== null) fd.append(k, v);
            });
            if (user?.user_id) fd.append("doc_submitted_by", user.user_id);
            if (newMainFile) fd.append("doc_file", newMainFile);

            await api.put(`/documents/${doc.doc_id}`, fd);

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

                        {/* New: Reference Files (same design as Add Task) */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">File References (PDF)</label>
                            {/* Existing references */}
                            <ul className="mb-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {existingRefs.length > 0 &&
                                    existingRefs.map((url, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center justify-between rounded border px-2 py-1 dark:border-gray-600"
                                        >
                                            <a
                                                className="text-blue-600 hover:underline"
                                                href={`${api.baseUrl.replace(/\/api$/, "")}${url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                📄 {url.split("/").pop()}
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => removeExistingRefAt(idx)}
                                                className="ml-2 text-red-500 hover:text-red-700"
                                                title="Remove from document"
                                            >
                                                ❌
                                            </button>
                                        </li>
                                    ))}
                                {existingRefs.length === 0 && <li className="text-xs text-gray-500 dark:text-gray-400">No existing references.</li>}
                            </ul>

                            {/* Add more */}
                            <input
                                type="file"
                                accept="application/pdf"
                                multiple
                                onChange={onAddRefFiles}
                                className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                            />
                            {refFileError && <p className="mt-1 text-sm text-red-600">{refFileError}</p>}
                            <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {newRefFiles.map((file, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between rounded border px-2 py-1 dark:border-gray-600"
                                    >
                                        <span>📄 {file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeNewRefAt(index)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            ❌
                                        </button>
                                    </li>
                                ))}
                            </ul>
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

                        {/* the main file (support document) */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium">File (PDF)</label>
                            {/* Current file */}
                            <div className="mb-2 flex items-center justify-between rounded border px-2 py-1 text-sm dark:border-gray-600">
                                <a
                                    className="text-blue-600 hover:underline"
                                    href={`${api.baseUrl.replace(/\/api$/, "")}${doc.doc_file}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Current: 📄 {doc.doc_file.split("/").pop()}
                                </a>
                                <button
                                    type="button"
                                    onClick={clearMainFile}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    title="Remove selected new file"
                                >
                                    ❌
                                </button>
                            </div>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={onMainFileChange}
                                className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                            />
                            {mainFileError && <p className="mt-1 text-sm text-red-600">{mainFileError}</p>}
                            {newMainFile && (
                                <div className="mt-2 flex items-center justify-between rounded border px-2 py-1 text-sm dark:border-gray-600">
                                    <span>📄 {newMainFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={clearMainFile}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        ❌
                                    </button>
                                </div>
                            )}
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
