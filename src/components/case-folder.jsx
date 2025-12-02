import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import { Eye, Folder, Search, ArrowLeft } from "lucide-react";
import ViewModal from "./view-case";

const CaseFolder = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeFolder, setActiveFolder] = useState("All");
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [search, setSearch] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const fetchCases = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/cases", {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch cases.");
            setCases(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFolder, search]);

    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getLawyerFullName = (c) => {
        return c.user_fname ? `${c.user_fname} ${c.user_mname ? c.user_mname[0] + "." : ""} ${c.user_lname}`.trim() : "Unassigned";
    };

    const caseFolders = [
        "All",
        "Civil Cases",
        "Criminal Cases",
        "Special Proceedings",
        "Constitutional Cases",
        "Jurisdictional Cases",
        "Special Courts Cases",
    ];

    // Filter by folder
    const filteredCases = cases.filter((c) => {
        if (activeFolder === "All") return true;
        const folder = activeFolder.toLowerCase().replace(/s$/, "");
        const category = c.cc_name?.toLowerCase().replace(/s$/, "");
        return category === folder;
    });

    // Filter by search
    const searchedCases = filteredCases.filter((c) => {
        const text = `${c.ct_name} ${c.cc_name} ${c.client_fullname}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // Pagination
    const totalPages = Math.ceil(searchedCases.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCases = searchedCases.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="mx-auto max-w-full p-6">
            {/* Header */}
            <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 p-6 shadow-lg">
                <h2 className="text-3xl font-bold text-white drop-shadow">Case Folder</h2>
                <p className="mt-1 text-base text-blue-100">Manage all case categories here.</p>
            </div>

            {/* Folder Categories */}
            <div className="mb-6 flex flex-wrap gap-3 justify-center">
                {caseFolders.map((folder) => (
                    <button
                        key={folder}
                        onClick={() => setActiveFolder(folder)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60
                            ${activeFolder === folder
                                ? "border-blue-700 bg-blue-700 text-white scale-105 shadow-lg"
                                : "border-gray-300 bg-white text-blue-900 hover:bg-blue-100 hover:border-blue-400"}
                        `}
                    >
                        <Folder size={18} />
                        <span>{folder}</span>
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="mb-6 flex justify-center">
                <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-md focus-within:ring-2 focus-within:ring-blue-400/60 dark:bg-slate-800">
                    <Search size={20} className="text-blue-700" />
                    <input
                        type="text"
                        placeholder="Search by case, type, or client..."
                        className="w-full bg-transparent px-2 py-1 text-base text-blue-900 outline-none dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Cases Table */}
            <div className="overflow-x-auto rounded-xl bg-white shadow-lg dark:bg-slate-900">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-blue-50 text-xs uppercase text-blue-900 dark:bg-slate-800 dark:text-blue-200">
                        <tr>
                            <th className="px-5 py-4">Case ID</th>
                            <th className="px-5 py-4">Case Name</th>
                            <th className="px-5 py-4">Category</th>
                            <th className="px-5 py-4">Client</th>
                            <th className="px-5 py-4">Date Filed</th>
                            <th className="px-5 py-4">Lawyer</th>
                            <th className="px-5 py-4">View</th>
                        </tr>
                    </thead>
                    <tbody className="text-blue-950 dark:text-white">
                        {paginatedCases.length > 0 ? (
                            paginatedCases.map((c, idx) => (
                                <tr
                                    key={c.case_id}
                                    className="border-t border-gray-200 transition hover:bg-slate-200 dark:border-gray-700 dark:hover:bg-blue-950"
                                >
                                    <td className="px-5 py-4 font-semibold">{c.case_id}</td>
                                    <td className="px-5 py-4">{c.ct_name}</td>
                                    <td className="px-5 py-4">{c.cc_name}</td>
                                    <td className="px-5 py-4">{c.client_fullname}</td>
                                    <td className="px-5 py-4">{formatDateTime(c.case_date_created)}</td>
                                    <td className="px-5 py-4">{c.user_id ? `Atty. ${getLawyerFullName(c)}` : <span className="italic text-gray-400">Unassigned</span>}</td>
                                    <td className="px-5 py-4">
                                        <button
                                            className="rounded-full bg-blue-100 p-2 text-blue-700 transition hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                                            onClick={() => setSelectedCase(c)}
                                            title="View Case Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-5 py-10 text-center text-gray-400 dark:text-gray-400"
                                >
                                    No cases found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination and Back Button */}
            <div className="mt-6 flex flex-col items-center justify-between gap-4 md:flex-row md:gap-0 w-full">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-blue-900 shadow hover:bg-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Cases</span>
                </button>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 shadow dark:bg-slate-800">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-full px-3 py-1 text-blue-700 hover:bg-blue-200 disabled:opacity-50 dark:text-blue-200 dark:hover:bg-slate-700"
                        >
                            &lt;
                        </button>
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded-full px-3 py-1 text-blue-700 hover:bg-blue-200 disabled:opacity-50 dark:text-blue-200 dark:hover:bg-slate-700"
                        >
                            &gt;
                        </button>
                    </div>
                )}
            </div>

            {/* View Case Modal */}
            <ViewModal
                selectedCase={selectedCase}
                tableData={cases}
                setSelectedCase={setSelectedCase}
                onCaseUpdated={fetchCases}
            />
        </div>
    );
};

export default CaseFolder;
