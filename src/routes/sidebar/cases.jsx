import { useState, useRef, useEffect } from "react";
import { Pencil, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClickOutside } from "@/hooks/use-click-outside";
import ViewModal from "../../components/view-case";
import { useAuth } from "@/context/auth-context";
import AddNewCase from "../../components/add-case";
import toast from "react-hot-toast";
import EditCaseModal from "../../components/edit-case";

const Cases = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // redirect non-admins
    useEffect(() => {
        if (!user) return; // wait until auth state is known
        if (user.user_role !== "Admin" && user.user_role !== "Lawyer") {
            navigate("/unauthorized");
        }
    }, [user, navigate]);

    const [search, setSearch] = useState("");
    const [tableData, setTableData] = useState([]);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const addCaseModalRef = useRef();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [caseToEdit, setCaseToEdit] = useState(null);

    // filter cases
    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    // get the full name of the (assigned) lawyer
    const getLawyerFullName = (lawyerId) => {
        const lawyer = tableData.find((u) => u.user_id === lawyerId);
        return lawyer
            ? `${lawyer.user_fname || ""} ${lawyer.user_mname ? lawyer.user_mname[0] + "." : ""} ${lawyer.user_lname || ""}`
                .replace(/\s+/g, " ")
                .trim()
            : "Unassigned";
    };

    const filteredCases = tableData.filter((cases) => {
        const matchesStatus = statusFilter ? cases.case_status === statusFilter : true;
        const searchLower = search.toLowerCase();
        const matchesSearch =
            (cases.case_id && cases.case_id.toString().includes(search)) ||
            (cases.ct_name && cases.ct_name.toLowerCase().includes(searchLower)) ||
            (cases.cc_name && cases.cc_name.toLowerCase().includes(searchLower)) ||
            (cases.client_fullname && cases.client_fullname.toLowerCase().includes(searchLower)) ||
            (cases.case_status && cases.case_status.toLowerCase().includes(searchLower)) ||
            (getLawyerFullName(cases.user_id) && getLawyerFullName(cases.user_id).toLowerCase().includes(searchLower)) ||
            (formatDateTime(cases.case_date_created) && formatDateTime(cases.case_date_created).toLowerCase().includes(searchLower));
        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredCases.length / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentCases = filteredCases.slice(startIndex, startIndex + rowsPerPage);

    // Fetch cases data from API
    const fetchCases = async () => {
        try {
            const cases_endpoint = user?.user_role === "Admin" ? "/cases" : `/cases/user/${user?.user_id}`;

            const response = await fetch(`http://localhost:3000/api${cases_endpoint}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch cases");
            }
            const data = await response.json();
            setTableData(data);
        } catch (error) {
            console.error("Error fetching cases:", error);
            setError(error.message + ". You might want to check your server connection.");
        }
    };

    useEffect(() => {
        fetchCases();
    }, [user]);

    const [newCase, setNewCase] = useState({
        client_id: "",
        cc_id: "",
        ct_id: "",
        user_id: user.user_role === "Admin" ? "" : user.user_id,
        assigned_by: user.user_role === "Admin" ? user.user_id : null,
        case_cabinet: "",
        case_drawer: "",
        case_fee: "",
        case_remarks: "",
        case_status: "",
    });

    useClickOutside([addCaseModalRef], () => setIsModalOpen(false));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
                setSelectedCase(null);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleAddCase = async (selectedTags) => {
        const toastId = toast.loading("Adding new case...", { duration: 4000 });

        try {
            const payload = {
                ...newCase,
                client_id: parseInt(newCase.client_id, 10) || null,
                cc_id: parseInt(newCase.cc_id, 10) || null,
                ct_id: parseInt(newCase.ct_id, 10) || null,
                assigned_by: newCase.assigned_by ? parseInt(newCase.assigned_by, 10) : null,
                user_id: newCase.user_id ? parseInt(newCase.user_id, 10) : null,
                case_fee: newCase.case_fee ? parseFloat(newCase.case_fee) : null,
                case_tag: JSON.stringify(selectedTags), // send as JSON string
            };

            const res = await fetch("http://localhost:3000/api/cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to add case");
            }

            const addedCase = await res.json();
            setTableData((prevData) => [addedCase, ...prevData]);
            setIsModalOpen(false);
            setNewCase({
                client_id: "",
                cc_id: "",
                ct_id: "",
                user_id: user.user_role === "Admin" ? "" : user.user_id,
                assigned_by: user.user_role === "Admin" ? user.user_id : null,
                case_cabinet: "",
                case_drawer: "",
                case_fee: "",
                case_remarks: "",
                case_status: "",
            });

            toast.success("New case added successfully!", { id: toastId, duration: 4000 });
        } catch (error) {
            console.error("Error adding case:", error);
            setError("Failed to add case. Please try again.");
            toast.error("Failed to add case. Please try again.", { id: toastId, duration: 4000 });
        }
    };

    // Editing Case
    const handleCaseUpdate = async (updatedCase) => {
        const toastId = toast.loading("Updating case...");
        try {
            const res = await fetch(`http://localhost:3000/api/cases/${updatedCase.case_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...updatedCase, last_updated_by: user.user_id }),
            });

            if (!res.ok) throw new Error("Failed to update case.");

            const updated = await res.json();

            setTableData((prevData) => prevData.map((c) => (c.case_id === updated.case_id ? updated : c)));

            toast.success("Case updated successfully!", { id: toastId });
        } catch (error) {
            console.error("Error updating case:", error);
            toast.error("Failed to update case.", { id: toastId });
        }
    };

    // Set default statusFilter
    useEffect(() => {
        if (tableData.some((c) => c.case_status === "Pending")) {
            setStatusFilter("Pending");
        } else {
            setStatusFilter("");
        }
    }, [tableData]);

    return (
        <div className="mx-auto">
            {error && <div className="mb-4 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-red-50 shadow">{error}</div>}

            <div className="mb-6">
                <h2 className="title">Cases</h2>
                <p className="text-sm text-gray-500">Manage all case details here.</p>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-2">
                {["All", "Pending", "Processing", "Completed", "Dismissed"].map((tab) => {
                    const baseColors = {
                        All: "bg-blue-500 text-white font-semibold",
                        Pending: "bg-yellow-500 text-white font-semibold",
                        Processing: "bg-blue-500 text-white font-semibold",
                        Completed: "bg-green-500 text-white font-semibold",
                        Dismissed: "bg-red-500 text-white font-semibold",
                    };

                    const active = statusFilter === tab || (tab === "All" && statusFilter === "");
                    return (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab === "All" ? "" : tab)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? baseColors[tab] : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
                                }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Search and Buttons */}
            <div className="card mb-5 flex flex-col gap-3 overflow-x-auto p-4 shadow-md md:flex-row md:items-center md:gap-x-3">
                <div className="flex flex-grow items-center gap-2 rounded-md border border-gray-300 bg-transparent px-3 py-2 focus-within:border-blue-600 focus-within:ring-blue-400 dark:border-slate-600 dark:focus-within:border-blue-600">
                    <Search
                        size={18}
                        className="text-gray-600 dark:text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search cases by name, client, date filed, status or lawyer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
                    />
                </div>

                <div className="flex flex-shrink-0 gap-2 whitespace-nowrap">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex h-10 items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white shadow hover:bg-green-700"
                    >
                        New Case
                    </button>
                    <button
                        onClick={() => navigate("/clients")}
                        className="flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
                    >
                        View Clients
                    </button>
                </div>
            </div>

            {/* Case Table */}
            <div className="card overflow-x-auto shadow-md">
                <table className="min-w-full table-auto text-left text-sm">
                    <thead className="text-xs uppercase dark:text-slate-300">
                        <tr>
                            <th className="px-4 py-3">Case ID</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Date Filed</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Lawyer</th>
                            <th className="px-4 py-3">Fee</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-950 dark:text-white">
                        {currentCases.length > 0 ? (
                            currentCases
                                .filter((c) => c.case_status !== "Archived (Completed)" && c.case_status !== "Archived (Dismissed)")
                                .map((cases) => (
                                    <tr
                                        key={cases.case_id}
                                        className="border-t border-gray-200 transition hover:bg-blue-100 dark:border-gray-700 dark:hover:bg-blue-950"
                                    >
                                        <td className="px-4 py-3">{cases.case_id}</td>
                                        <td className="px-4 py-3">{cases.ct_name}</td>
                                        <td className="px-4 py-3">{cases.client_fullname}</td>
                                        <td className="px-4 py-3">{formatDateTime(cases.case_date_created)}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${cases.case_status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300"
                                                    : cases.case_status === "Processing"
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300"
                                                        : cases.case_status === "Completed"
                                                            ? "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300"
                                                            : "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300"
                                                    }`}
                                            >
                                                {cases.case_status}
                                            </span>
                                        </td>
                                        {cases.user_id ? (
                                            <td className="px-4 py-3">{getLawyerFullName(cases.user_id)}</td>
                                        ) : (
                                            <td className="px-4 py-3 italic text-gray-500">Unassigned</td>
                                        )}
                                        <td className="px-4 py-3">
                                            {cases?.case_balance !== null && cases?.case_balance !== undefined
                                                ? new Intl.NumberFormat("en-PH", {
                                                    style: "currency",
                                                    currency: "PHP",
                                                }).format(Number(cases.case_balance))
                                                : "₱0.00"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-1">
                                                <button
                                                    className="p-1.5 text-blue-600 hover:text-blue-800"
                                                    onClick={() => setSelectedCase(cases)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {cases.case_status !== "Completed" && cases.case_status !== "Dismissed" && (
                                                    <button
                                                        title={user.user_role === "Admin" ? "Edit case" : "Update and take case"}
                                                        className="p-1.5 text-yellow-500 hover:text-yellow-700"
                                                        onClick={() => {
                                                            setCaseToEdit({
                                                                ...cases,
                                                                lawyer_fullname: getLawyerFullName(cases.user_id),
                                                                assigned_by_name: getLawyerFullName(cases.assigned_by),
                                                            });
                                                            setEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                                >
                                    No cases found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-3 p-4">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className={`rounded border px-3 py-1 ${currentPage === 1
                            ? "cursor-not-allowed bg-gray-200 text-gray-400"
                            : "bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                            }`}
                    >
                        &lt;
                    </button>

                    <span className="text-sm text-gray-700 dark:text-white">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`rounded border px-3 py-1 ${currentPage === totalPages
                            ? "cursor-not-allowed bg-gray-200 text-gray-400"
                            : "bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                            }`}
                    >
                        &gt;
                    </button>
                </div>
            )}

            {/* View Case Modal */}
            <ViewModal
                selectedCase={selectedCase}
                tableData={tableData}
                setSelectedCase={setSelectedCase}
                onCaseUpdated={fetchCases}
            />

            {/* Edit Case Modal */}
            <EditCaseModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                caseData={caseToEdit}
                onUpdate={handleCaseUpdate}
                user={user}
            />

            {/* Add New Case Modal */}
            <AddNewCase
                user={user}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                handleAddCase={handleAddCase}
                newCase={newCase}
                setNewCase={setNewCase}
                addCaseModalRef={addCaseModalRef}
            />
        </div>
    );
};

export default Cases;
