// Add Task Document modal component
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth-context.jsx";
import toast from "react-hot-toast";
import Spinner from "./loading.jsx";
import api from "../utils/api";

export default function AddTask({ caseId, onClose, onAdded }) {
    const { user } = useAuth() || {};

    const [docs, setDocs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [refDocs, setRefDocs] = useState([]);
    const [fileError, setFileError] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // Form state (exclude doc_references here, we handle via refDocs state)
    const [form, setForm] = useState({
        doc_name: "",
        doc_description: "",
        doc_task: "",
        doc_prio_level: "",
        doc_due_date: "",
        doc_tag: "",
        doc_password: "",
        doc_tasked_to: "",
        doc_tasked_by: user?.user_id || "",
        doc_type: "Task", // keep consistent with backend
        doc_status: "todo",
        case_id: caseId,
    });

    // Priority → days mapping
    const prioToDays = useMemo(() => ({ Low: 14, Mid: 5, High: 2 }), []);

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

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onPriorityChange = (e) => {
        const value = e.target.value;
        const days = prioToDays[value];
        let due = "";
        if (days) {
            const dt = new Date();
            dt.setDate(dt.getDate() + days);
            dt.setHours(23, 59, 59, 999);
            due = formatTimestamp(dt);
        }
        setForm((prev) => ({ ...prev, doc_prio_level: value, doc_due_date: due }));
    };

    // Handle file uploads
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        const oversized = selectedFiles.filter((f) => f.size > 10 * 1024 * 1024);

        if (oversized.length > 0) {
            setFileError("Each file must be 10MB or less.");
            e.target.value = null;
            return;
        }

        setRefDocs((prev) => [...prev, ...selectedFiles]);
        setFileError("");
        e.target.value = null; // allow same file to be picked again
    };

    const removeFile = (index) => {
        setRefDocs((prev) => prev.filter((_, i) => i !== index));
    };

    // Fetch existing documents
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

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.get("/users");
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!caseId) return;
        setSubmitting(true);
        setError("");

        const toastId = toast.loading("Submitting task document...", { duration: 4000 });

        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v !== undefined && v !== null) fd.append(k, v);
            });

            // append reference docs
            refDocs.forEach((f) => fd.append("doc_reference", f));

            await api.post("/documents", fd);

            toast.success("Task document created successfully!", { id: toastId, duration: 4000 });

            // reset
            setForm({
                doc_name: "",
                doc_description: "",
                doc_task: "",
                doc_prio_level: "",
                doc_due_date: "",
                doc_tag: "",
                doc_password: "",
                doc_tasked_to: "",
                doc_tasked_by: user?.user_id || "",
                doc_type: "Task",
                doc_status: "todo",
                case_id: caseId,
            });
            setRefDocs([]);
            fetchDocuments();
            if (onAdded) onAdded();
        } catch (e) {
            setError(e.message || "Submission failed. Please try again.");
            console.error("Error submitting task document:", e);
            toast.error("Failed to submit task document.", { id: toastId, duration: 4000 });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && <div className="rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-700">{error}</div>}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Task Document</h2>

            <form
                onSubmit={onSubmit}
                className="space-y-4"
            >
                {/* Grid Inputs */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Tasked To */}
                    <div className="relative flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tasked To</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowDropdown((prev) => !prev)}
                                className="flex w-full items-center justify-between rounded border px-3 py-2 text-left dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                            >
                                {form.doc_tasked_to
                                    ? (() => {
                                          const selected = users.find((u) => u.user_id === form.doc_tasked_to);
                                          return (
                                              <span>
                                                  {selected.user_fname} {selected.user_mname ? selected.user_mname[0] + ". " : ""}
                                                  {selected.user_lname}{" "}
                                                  <span
                                                      className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${
                                                          selected.user_role === "Paralegal"
                                                              ? "bg-blue-100 text-blue-700"
                                                              : "bg-green-100 text-green-700"
                                                      }`}
                                                  >
                                                      {selected.user_role}
                                                  </span>
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
                                                    setForm((prev) => ({ ...prev, doc_tasked_to: u.user_id }));
                                                    setShowDropdown(false);
                                                }}
                                                className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700"
                                            >
                                                <span className="text-gray-800 dark:text-gray-100">
                                                    {u.user_fname} {u.user_mname ? u.user_mname[0] + ". " : ""}
                                                    {u.user_lname}
                                                </span>
                                                <span
                                                    className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${
                                                        u.user_role === "Paralegal" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                                    }`}
                                                >
                                                    {u.user_role}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document Name */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Document Name</label>
                        <input
                            name="doc_name"
                            value={form.doc_name}
                            onChange={onChange}
                            type="text"
                            required
                            placeholder="e.g. Evidence Summary"
                            className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Priority Level</label>
                        <select
                            name="doc_prio_level"
                            value={form.doc_prio_level}
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

                    {/* Due Date */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input
                            name="doc_due_date"
                            value={form.doc_due_date ? form.doc_due_date.slice(0, 10) : ""}
                            type="date"
                            readOnly
                            required
                            className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Tag */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tag</label>
                        <input
                            name="doc_tag"
                            value={form.doc_tag}
                            onChange={onChange}
                            type="text"
                            placeholder="e.g. urgent, review"
                            className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            name="doc_password"
                            value={form.doc_password}
                            onChange={onChange}
                            type="password"
                            placeholder="Optional password"
                            className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Description & Task */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            name="doc_description"
                            value={form.doc_description}
                            onChange={onChange}
                            rows={3}
                            placeholder="Short description"
                            className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Task</label>
                        <textarea
                            name="doc_task"
                            value={form.doc_task}
                            onChange={onChange}
                            rows={3}
                            placeholder="Detailed task instructions"
                            className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                            required
                        />
                    </div>
                </div>

                {/* Reference Files */}
                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">File References (PDF)</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handleFileChange}
                        className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
                    />
                    {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
                    <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {refDocs.map((file, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between rounded border px-2 py-1 dark:border-gray-600"
                            >
                                <span>📄 {file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                >
                                    ❌
                                </button>
                            </li>
                        ))}
                    </ul>
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
                                Adding Task... <Spinner />
                            </>
                        ) : (
                            "Add Task Document"
                        )}
                    </button>
                </div>
            </form>

            {/* Existing Documents */}
            <div className="mt-4 max-h-40 overflow-x-auto">
                <h3 className="top-0 mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Existing Documents</h3>
                {loadingDocs ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                ) : docs.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents found.</p>
                ) : (
                    <table className="min-w-full border text-xs dark:border-gray-600">
                        <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr>
                                <th className="border p-2 text-left dark:border-gray-600 dark:text-gray-300">Name</th>
                                <th className="border p-2 text-left dark:border-gray-600 dark:text-gray-300">Type</th>
                                <th className="border p-2 text-left dark:border-gray-600 dark:text-gray-300">Priority</th>
                                <th className="border p-2 text-left dark:border-gray-600 dark:text-gray-300">Due</th>
                                <th className="border p-2 text-left dark:border-gray-600 dark:text-gray-300">Tag</th>
                                <th className="border p-2 text-left dark:border-gray-600 dark:text-gray-300">File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((d) => (
                                <tr
                                    key={d.doc_id}
                                    className="odd:bg-white even:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-800"
                                >
                                    <td className="border p-2 dark:border-gray-600 dark:text-gray-200">{d.doc_name}</td>
                                    <td className="border p-2 dark:border-gray-600 dark:text-gray-200">{d.doc_type}</td>
                                    <td className="border p-2 dark:border-gray-600 dark:text-gray-200">{d.doc_prio_level || "-"}</td>
                                    <td className="border p-2 dark:border-gray-600 dark:text-gray-200">
                                        {d.doc_due_date ? new Date(d.doc_due_date).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="border p-2 dark:border-gray-600 dark:text-gray-200">{d.doc_tag || "-"}</td>
                                    <td className="border p-2 dark:border-gray-600 dark:text-gray-200">
                                        {d.doc_file ? (
                                            <a
                                                className="text-blue-600 hover:underline"
                                                href={`${api.baseUrl.replace(/\/api$/, "")}${d.doc_file}`}
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
    );
}
