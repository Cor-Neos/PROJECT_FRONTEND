import { useState, useEffect } from "react";
import { Trash2, FileText, Search, Filter, X } from "lucide-react";

const roles = ["All", "Supporting", "Task"];

const Documents = () => {
    const [error, setError] = useState("");
    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState("All");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch documents (with backend role filter)
    useEffect(() => {
        const fetchDocs = async () => {
            setError("");
            try {
                const query =
                    selectedRole === "All"
                        ? ""
                        : `?type=${encodeURIComponent(selectedRole)}`;

                const res = await fetch(`http://localhost:3000/api/documents${query}`, {
                    credentials: "include",
                });

                if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);

                const data = await res.json();
                setDocuments(Array.isArray(data) ? data : []);
                setCurrentPage(1); // reset to first page when changing filter
            } catch (e) {
                setError(e.message || "Failed to load documents");
                setDocuments([]);
            }
        };

        fetchDocs();
    }, [selectedRole]);

    // Fetch users for "Submitted By"
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/users", {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to load users");
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            } catch {
                setUsers([]);
            }
        };
        fetchUsers();
    }, []);

    const toggleFilterModal = () => setShowFilterModal((prev) => !prev);

    const confirmDelete = (doc) => {
        setDocToDelete(doc);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (docToDelete) {
            setDocuments((prev) =>
                prev.filter((d) => d.doc_id !== docToDelete.doc_id)
            );
            setDocToDelete(null);
            setShowDeleteModal(false);
        }
    };

    // Get submitter name from users
    const getSubmitterName = (submittedById) => {
        if (!submittedById) return "-";
        const u = users.find((x) => x.user_id === submittedById);
        if (!u) return String(submittedById);
        const m = u.user_mname ? `${u.user_mname[0]}.` : "";
        const name = `${u.user_fname} ${m} ${u.user_lname}`.replace(/\s+/g, " ").trim();
        return u.user_role === "Staff" ? name : `Atty. ${name}`;
    };

    // Client-side search filter
    const filteredDocs = documents.filter((doc) => {
        const term = search.toLowerCase();
        const fields = [
            doc.doc_name,
            doc.doc_type,
            doc.doc_tag,
            String(doc.case_id ?? ""),
            String(doc.doc_submitted_by ?? ""),
            String(doc.doc_tasked_by ?? ""),
        ].map((v) => String(v || "").toLowerCase());
        return fields.some((f) => f.includes(term));
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">
            {error && (
                <div className="mb-4 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-red-50 shadow">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
                <div>
                    <h1 className="title">Documents</h1>
                    <p className="text-sm text-gray-500">
                        Manage and organize case-related documents
                    </p>
                </div>
                <div className="mt-4 flex gap-2 md:mt-0">
                    <button
                        className="flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                        onClick={toggleFilterModal}
                    >
                        <Filter size={16} /> Filters
                    </button>
                </div>
            </div>

            {/* Role Filters */}
            <div className="mb-4 flex flex-wrap gap-2">
                {roles.map((role) => (
                    <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`rounded-full px-4 py-2 text-sm font-medium ${selectedRole === role
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
                            }`}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="card shadow-md">
                <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-transparent px-3 py-2 focus-within:border-blue-600 focus-within:ring-blue-400 dark:border-slate-600">
                    <Search size={18} className="text-gray-600 dark:text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search documents by name, type, tag, or case..."
                        className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Document Table */}
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-800 dark:text-white">
                    <thead className="text-xs uppercase dark:text-slate-300">
                        <tr>
                            <th className="px-4 py-3">Document ID</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Case ID</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Submitted By</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedDocs.filter((doc) => doc.doc_file).length === 0 ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="px-4 py-3 text-center text-gray-400"
                                >
                                    No documents with files to display.
                                </td>
                            </tr>
                        ) : (
                            paginatedDocs
                                .filter((doc) => doc.doc_file)
                                .map((doc) => (
                                    <tr
                                        key={doc.doc_id}
                                        className="border-t border-gray-200 transition hover:bg-blue-100 dark:border-gray-700 dark:hover:bg-blue-950"
                                    >
                                        <td className="px-4 py-3">{doc.doc_id}</td>
                                        <td className="flex items-center gap-2 px-4 py-4 font-medium text-blue-800">
                                            {doc.doc_name || "Untitled"}
                                        </td>
                                        <td className="px-4 py-3">{doc.case_id}</td>
                                        <td className="px-4 py-3">{doc.doc_type}</td>
                                        <td className="px-4 py-3">
                                            {getSubmitterName(doc.doc_submitted_by)}
                                        </td>
                                        <td className="flex justify-center gap-4 px-4 py-3">
                                            <a
                                                href={`http://localhost:3000${doc.doc_file}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 rounded-md border border-blue-600 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                                            >
                                                <FileText size={14} />
                                                View
                                            </a>
                                            <button
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => confirmDelete(doc)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-end px-4 py-3 text-sm text-gray-700 dark:text-white">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                        >
                            &lt;
                        </button>
                        <div>
                            Page {currentPage} of {totalPages}
                        </div>
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={toggleFilterModal}
                            className="absolute right-3 top-3 text-gray-500 hover:text-black"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">
                            Filter Options
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Document Type
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Task, Supporting"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Uploaded By
                                </label>
                                <input
                                    type="text"
                                    placeholder="User id"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    onClick={toggleFilterModal}
                                    className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={toggleFilterModal}
                                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-black"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">
                            Are you sure you want to remove this document?
                        </h2>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
