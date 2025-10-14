import { useState, useEffect } from "react";
import { Eye, Trash2, Search } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

export const Payments = () => {
    const { user } = useAuth();
    const [error, setError] = useState("");
    const [paymentsData, setPaymentsData] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCaseBalance, setSelectedCaseBalance] = useState(null);

    // Helpers
    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(amount);

    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // fetching here the cases for the add payment modal
    useEffect(() => {
        const fetchCases = async () => {
            try {
                const cases_endpoint = user.user_role === "Admin" ? "cases" : "cases/user/" + user.user_id;
                const res = await fetch("http://localhost:3000/api/" + cases_endpoint, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json();
                if (res.ok) {
                    // setCases(data);
                    setCases(data.filter((c) => c.case_balance > 0));
                } else {
                    console.error("Failed to fetch cases:", data.error);
                }
            } catch (err) {
                console.error("Error fetching cases:", err);
            }
        };

        fetchCases();
    }, []);

    // fetching here the payments
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const payment_endpoint = user.user_role === "Admin" ? "payments" : "payments/lawyer/" + user.user_id;

                const response = await fetch(`http://localhost:3000/api/${payment_endpoint}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch payments");
                }

                const data = await response.json();
                setPaymentsData(data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch payments. Please try again later.");
            }
        };

        fetchPayments();
    }, []);

    const [searchTerm, setSearchTerm] = useState("");
    const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [addPayment, setAddPayment] = useState(null);

    const filteredPayments = paymentsData.filter((p) => {
        const matchesSearch =
            p.payment_id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.client_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.ct_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.payment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formatDateTime(p.payment_date).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPaymentType = paymentTypeFilter === "All" || p.payment_type === paymentTypeFilter;

        return matchesSearch && matchesPaymentType;
    });

    // Pagination
    const rowsPerPage = 10;
    const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
    const paginatedPayments = filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Add Payment
    const handleAddPayment = async () => {
        if (!addPayment) return;

        const bal = Number(selectedCaseBalance);
        const amt = Number(addPayment.payment_amount);

        if (!addPayment.case_id) {
            toast.error("Please select a case.");
            return;
        }
        if (!addPayment.payment_type) {
            toast.error("Please select a payment type.");
            return;
        }
        if (Number.isNaN(amt) || amt <= 0) {
            toast.error("Enter a valid payment amount.");
            return;
        }
        if (Number.isNaN(bal)) {
            toast.error("Unable to validate case balance.");
            return;
        }
        if (amt !== bal) {
            toast.error(`Payment must be exactly ${formatCurrency(bal)}.`);
            return;
        }

        const toastId = toast.loading("Adding payment...", { duration: 4000 });
        try {
            const res = await fetch("http://localhost:3000/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...addPayment, payment_amount: amt.toFixed(2) }),
            });

            const data = await res.json();

            if (res.ok) {
                setPaymentsData((prev) => [...prev, data]);

                toast.success("Payment added successfully!", { id: toastId, duration: 4000 });
                setAddPayment(null);
            } else {
                toast.error(data.error || "Failed to add payment", { id: toastId });
            }
        } catch (err) {
            console.error("Error adding payment:", err);
            toast.error("Error adding payment", { id: toastId });
        }
    };

    const handleDeletePayment = (payment) => {
        if (window.confirm(`Are you sure you want to delete payment ID ${payment.payment_id}? This action cannot be undone.`)) {
            const toastId = toast.loading("Deleting payment...", { duration: 4000 });

            try {
                fetch(`http://localhost:3000/api/payments/${payment.payment_id}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then((res) => {
                    if (!res.ok) {
                        throw new Error("Failed to delete payment");
                    }
                });

                setPaymentsData((prev) => prev.filter((p) => p.payment_id !== payment.payment_id));
                toast.success("Payment deleted successfully!", { id: toastId, duration: 4000 });
            } catch (err) {
                console.error(err);
                setError("Failed to delete payment. Please try again later.");
                toast.error("Failed to delete payment.", { id: toastId, duration: 4000 });
                return;
            }
        }
    };

    return (
        <div className="bg-blue rounded-xl">
            {error && <div className="mb-4 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-red-50 shadow">{error}</div>}
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="title">Payments</h1>
                    <p className="text-sm text-gray-500">Track and manage all payment records.</p>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="card mb-6 flex flex-col items-center gap-3 rounded-lg bg-white p-4 shadow-md dark:bg-slate-800 md:flex-row">
                <div className="focus:ring-0.5 flex flex-grow items-center gap-2 rounded-md border border-gray-300 bg-transparent px-3 py-2 focus-within:border-blue-600 focus-within:ring-blue-400 dark:border-slate-600 dark:focus-within:border-blue-600">
                    <Search
                        size={18}
                        className="text-gray-600 dark:text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search payments by client, case or date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
                    />
                </div>

                <select
                    value={paymentTypeFilter}
                    onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 outline-none focus:border-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-600"
                >
                    <option value="All">All Types</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                </select>
                <button
                    onClick={() => setAddPayment({ case_id: "", user_id: user.user_id, payment_amount: "", payment_type: "" })}
                    className="flex h-10 items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white shadow hover:bg-green-700"
                >
                    Add Payment
                </button>
            </div>

            {/* Payments Table */}
            <div className="card w-full overflow-x-auto">
                <div className="overflow-y-auto">
                    <table className="min-w-full table-auto text-left text-sm">
                        <thead className="card-title z-100 sticky top-0 bg-white text-xs uppercase dark:bg-slate-900">
                            <tr>
                                <th className="px-4 py-3">Payment ID</th>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Case ID</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Payment Type</th>
                                <th className="px-4 py-3">Added By</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-white">
                            {paginatedPayments.length > 0 ? (
                                paginatedPayments.map((p) => (
                                    <tr
                                        key={p.payment_id}
                                        className="border-t border-gray-200 transition hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-slate-800"
                                    >
                                        <td className="px-4 py-3">{p.payment_id}</td>
                                        <td className="px-4 py-3">{p.client_fullname}</td>
                                        <td
                                            className="max-w-xs truncate px-4 py-3 text-center font-medium"
                                            title={p.case_id}
                                        >
                                            {p.case_id}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">{formatCurrency(p.payment_amount)}</td>
                                        <td className="px-4 py-3">{formatDateTime(p.payment_date)}</td>
                                        <td className="px-4 py-3">{p.payment_type}</td>
                                        <td className="px-4 py-3">
                                            {p.user_fname} {p.user_mname ? p.user_mname[0] + "." : ""} {p.user_lname}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                className="p-1.5 text-red-600 hover:text-red-800"
                                                onClick={() => handleDeletePayment(p)}
                                                title="Delete Payment"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                                    >
                                        No payments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-2 flex justify-end px-4 py-3 text-sm text-gray-700 dark:text-white">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                        >
                            &lt;
                        </button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}

            {/* Add Payment Modal */}
            {addPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
                        <h3 className="mb-6 text-xl font-bold text-blue-900 dark:text-slate-200">Add Payment</h3>
                        <div className="grid grid-cols-1 gap-4 text-sm text-blue-900 sm:grid-cols-2">
                            <div>
                                <label className="font-semibold dark:text-blue-700">Case <span className="text-red-500">*</span></label>
                                <select
                                    value={addPayment.case_id}
                                    onChange={(e) => {
                                        const caseId = parseInt(e.target.value, 10);
                                        const selected = cases.find((c) => c.case_id === caseId);

                                        setAddPayment({ ...addPayment, case_id: e.target.value });
                                        setSelectedCaseBalance(selected ? selected.case_balance : null);
                                    }}
                                    className="w-full rounded-md border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Select Case
                                    </option>
                                    {cases.filter((c) => c.case_status === "Processing")
                                        .map((c) => (
                                            <option
                                                key={c.case_id}
                                                value={c.case_id}
                                            >
                                                {c.case_id} – {c.client_fullname} ({c.ct_name})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="font-semibold dark:text-blue-700">Lawyer <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={addPayment.user_id}
                                    readOnly
                                    className="w-full rounded-md border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                                />
                                <p className="mt-1 text-xs text-gray-500">(Your User ID)</p>
                            </div>

                            <div>
                                <label className="font-semibold dark:text-blue-700">Amount <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={addPayment.payment_amount}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        // Allow empty string for editing
                                        if (value === "") {
                                            setAddPayment({
                                                ...addPayment,
                                                payment_amount: "",
                                            });
                                            return;
                                        }

                                        // Prevent negative values
                                        if (parseFloat(value) < 0) {
                                            alert("Amount cannot be negative!");
                                            return;
                                        }

                                        setAddPayment({
                                            ...addPayment,
                                            payment_amount: value,
                                        });
                                    }}
                                    onBlur={() => {
                                        if (addPayment.payment_amount === "") return; // don't alert if user cleared it

                                        if (parseFloat(addPayment.payment_amount) >= 0) {
                                            setAddPayment({
                                                ...addPayment,
                                                payment_amount: parseFloat(addPayment.payment_amount).toFixed(2),
                                            });
                                        } else {
                                            alert("Invalid amount! Resetting to 0.00");
                                            setAddPayment({
                                                ...addPayment,
                                                payment_amount: "0.00",
                                            });
                                        }
                                    }}
                                    className="w-full rounded-md border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                                    placeholder="0.00"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {selectedCaseBalance !== null
                                        ? `Total Case Fee: ${formatCurrency(selectedCaseBalance)}`
                                        : "Select a case to see balance"}
                                </p>
                            </div>

                            <div>
                                <label className="font-semibold dark:text-blue-700">Payment Type <span className="text-red-500">*</span></label>
                                <select
                                    value={addPayment.payment_type}
                                    onChange={(e) => setAddPayment({ ...addPayment, payment_type: e.target.value })}
                                    className="w-full rounded-md border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Select Payment Type
                                    </option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setAddPayment(null)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAddPayment()}
                                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                            >
                                Add Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};