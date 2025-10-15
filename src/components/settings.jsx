import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, List, RefreshCw, Building2, Lock, Archive, Info, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

// Simple reusable section card
const SettingsCard = ({ title, actions, children }) => (
    <section>
        <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            {actions}
        </div>
        <div className="space-y-6 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">{children}</div>
    </section>
);

const API_BASE = "http://localhost:3000/api";

const Settings = () => {
    const [activeTab, setActiveTab] = useState("branch");
    const { user } = useAuth?.() || { user: null };

    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [caseLoading, setCaseLoading] = useState(false);
    const [caseError, setCaseError] = useState("");

    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [branchesError, setBranchesError] = useState("");

    const [branchDrafts, setBranchDrafts] = useState([]);
    const [branchName, setBranchName] = useState("");
    const [branchAddress, setBranchAddress] = useState("");
    const [branchEmail, setBranchEmail] = useState("");
    const [branchPhone, setBranchPhone] = useState("");
    // New: edit states for branch PUT
    const [editingBranchId, setEditingBranchId] = useState(null);
    const [editingBranchName, setEditingBranchName] = useState("");

    // Case preferences (local)
    const [customCategories, setCustomCategories] = useState([]);
    const [customTypes, setCustomTypes] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newTypeName, setNewTypeName] = useState("");
    // New: form helpers for server add
    const [addCatLoading, setAddCatLoading] = useState(false);
    const [addCatError, setAddCatError] = useState("");
    const [addTypeLoading, setAddTypeLoading] = useState(false);
    const [addTypeError, setAddTypeError] = useState("");
    const [newTypeCategoryId, setNewTypeCategoryId] = useState("");

    // Archive counts (from backend)
    const [processingCount, setProcessingCount] = useState(null);
    const [archivedCount, setArchivedCount] = useState(null);
    const [userProcessingCount, setUserProcessingCount] = useState(null);
    const [userArchivedCount, setUserArchivedCount] = useState(null);
    const [archiveCountsLoading, setArchiveCountsLoading] = useState(false);
    const [archiveCountsError, setArchiveCountsError] = useState("");

    // Users (for Case Access overview)
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");

    // Logs (to match loadLogs usage)
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState("");

    // Logs filters and pagination (frontend-only, hits backend with query params if supported)
    const [logQuery, setLogQuery] = useState("");
    const [logUserId, setLogUserId] = useState("");
    const [logStart, setLogStart] = useState(""); // yyyy-mm-dd
    const [logEnd, setLogEnd] = useState(""); // yyyy-mm-dd
    const [logPage, setLogPage] = useState(1);
    const [logLimit, setLogLimit] = useState(20);
    const [logHasMore, setLogHasMore] = useState(false);

    // --- Helpers ---
    const fetchJson = async (url, opts = {}) => {
        const res = await fetch(url, { credentials: "include", ...opts });
        if (!res.ok) throw new Error((await res.text()) || "Request failed");
        // Handle 204 No Content or empty body safely
        if (res.status === 204) return null;
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
            // Try text; return null if empty
            const text = await res.text();
            return text ? text : null;
        }
        return res.json();
    };

    const loadCaseData = async () => {
        setCaseError("");
        setCaseLoading(true);
        try {
            const [cat, typ] = await Promise.all([fetchJson(`${API_BASE}/case-categories`), fetchJson(`${API_BASE}/case-category-types`)]);
            setCategories(Array.isArray(cat) ? cat : []);
            setTypes(Array.isArray(typ) ? typ : []);
        } catch (e) {
            setCaseError(e.message || "Failed to load case data");
            setCategories([]);
            setTypes([]);
        } finally {
            setCaseLoading(false);
        }
    };

    const loadBranches = async () => {
        setBranchesError("");
        setBranchesLoading(true);
        try {
            const data = await fetchJson(`${API_BASE}/branches`);
            setBranches(Array.isArray(data) ? data : []);
        } catch (e) {
            setBranchesError(e.message || "Failed to load branches");
            setBranches([]);
        } finally {
            setBranchesLoading(false);
        }
    };

    const saveBranchDrafts = (list) => {
        setBranchDrafts(list);
        try {
            localStorage.setItem("branch_drafts", JSON.stringify(list));
        } catch { }
    };
    const loadBranchDrafts = () => {
        try {
            const raw = localStorage.getItem("branch_drafts");
            if (raw) setBranchDrafts(JSON.parse(raw));
        } catch { }
    };
    // Replace local-only draft submit with server POST; keep drafts as optional fallback list
    const addBranchDraft = async (e) => {
        e.preventDefault();
        if (!branchName.trim()) return;
        const name = branchName.trim();
        const toastId = toast.loading("Adding branch...", { duration: 3000 });
        try {
            const created = await fetchJson(`${API_BASE}/branches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ branch_name: name }),
            });
            // Optimistically add to list
            setBranches((prev) => [created, ...prev]);
            toast.success("Branch added", { id: toastId, duration: 3000 });
            setBranchName("");
            setBranchAddress("");
            setBranchEmail("");
            setBranchPhone("");
        } catch (e) {
            toast.error(e.message || "Failed to add branch", { id: toastId, duration: 4000 });
        }
    };
    const removeBranchDraft = (id) => {
        const next = branchDrafts.filter((d) => d.id !== id);
        saveBranchDrafts(next);
    };

    // edit branch
    const startEditBranch = (b) => {
        const id = b?.branch_id ?? b?.id;
        if (!id) return;
        setEditingBranchId(id);
        setEditingBranchName(b?.branch_name ?? b?.name ?? "");
    };
    const cancelEditBranch = () => {
        setEditingBranchId(null);
        setEditingBranchName("");
    };
    const saveEditBranch = async () => {
        const id = editingBranchId;
        const name = editingBranchName.trim();
        if (!id || !name) return;
        const toastId = toast.loading("Updating branch...", { duration: 3000 });
        try {
            const updated = await fetchJson(`${API_BASE}/branches/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ branch_name: name }),
            });
            setBranches((prev) => prev.map((b) => ((b?.branch_id ?? b?.id) === id ? updated : b)));
            toast.success("Branch updated", { id: toastId, duration: 3000 });
            cancelEditBranch();
        } catch (e) {
            toast.error(e.message || "Failed to update branch", { id: toastId, duration: 4000 });
        }
    };
    const deleteBranch = async (id) => {
        if (!id) return;
        const toastId = toast.loading("Deleting branch...", { duration: 3000 });
        try {
            await fetchJson(`${API_BASE}/branches/${id}`, {
                method: "DELETE",
            });
            setBranches((prev) => prev.filter((b) => (b?.branch_id ?? b?.id) !== id));
            toast.success("Branch deleted", { id: toastId, duration: 3000 });
        } catch (e) {
            toast.error(e.message || "Failed to delete branch", { id: toastId, duration: 4000 });
        }
    };

    const loadUsers = async () => {
        setUsersError("");
        setUsersLoading(true);
        try {
            const data = await fetchJson(`${API_BASE}/users`);
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            setUsersError(e.message || "Failed to load users");
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const extractCount = (data) => {
        if (typeof data === "number") return data;
        if (data && typeof data === "object") {
            if (typeof data.count === "number") return data.count;
            if (typeof data.total === "number") return data.total;
            if (typeof data.value === "number") return data.value;
        }
        return 0;
    };

    const loadArchiveCounts = async () => {
        setArchiveCountsError("");
        setArchiveCountsLoading(true);
        try {
            const [proc, arch] = await Promise.all([fetchJson(`${API_BASE}/cases/count/processing`), fetchJson(`${API_BASE}/cases/count/archived`)]);
            setProcessingCount(extractCount(proc));
            setArchivedCount(extractCount(arch));

            if (user?.user_id) {
                const [uproc, uarch] = await Promise.all([
                    fetchJson(`${API_BASE}/cases/count/processing/user/${user.user_id}`),
                    fetchJson(`${API_BASE}/cases/count/archived/user/${user.user_id}`),
                ]);
                setUserProcessingCount(extractCount(uproc));
                setUserArchivedCount(extractCount(uarch));
            } else {
                setUserProcessingCount(null);
                setUserArchivedCount(null);
            }
        } catch (e) {
            setArchiveCountsError(e.message || "Failed to load archive counts");
            setProcessingCount(null);
            setArchivedCount(null);
            setUserProcessingCount(null);
            setUserArchivedCount(null);
        } finally {
            setArchiveCountsLoading(false);
        }
    };

    const loadLogs = async () => {
        setLogsError("");
        setLogsLoading(true);
        try {
            const data = await fetchJson(`${API_BASE}/user-logs`);
            setLogs(Array.isArray(data) ? data.slice(0, 50) : []);
            // heuristic for hasMore when backend doesn't return total
            const len = Array.isArray(data) ? data.length : 0;
            setLogHasMore(len >= 50);
            setLogPage(1);
        } catch (e) {
            setLogsError(e.message || "Failed to load logs");
            setLogs([]);
            setLogHasMore(false);
        } finally {
            setLogsLoading(false);
        }
    };

    // Logs with filters/pagination without changing backend code
    const buildLogsQueryString = (pageOverride) => {
        const qs = new URLSearchParams();
        if (logQuery.trim()) qs.set("q", logQuery.trim());
        if (logUserId) qs.set("user_id", String(logUserId));
        if (logStart) qs.set("start", new Date(logStart).toISOString());
        if (logEnd) qs.set("end", new Date(logEnd).toISOString());
        const pageToUse = pageOverride ?? logPage;
        if (pageToUse && pageToUse > 0) qs.set("page", String(pageToUse));
        if (logLimit) qs.set("limit", String(logLimit));
        return qs.toString();
    };

    const fetchLogsWithFilters = async ({ page, merge } = {}) => {
        setLogsError("");
        setLogsLoading(true);
        try {
            const qs = buildLogsQueryString(page);
            const url = qs ? `${API_BASE}/user-logs?${qs}` : `${API_BASE}/user-logs`;
            const prevCount = merge ? logs.length : 0;
            const data = await fetchJson(url);
            const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
            if (merge) {
                setLogs((prev) => [...prev, ...items]);
            } else {
                setLogs(items);
            }
            const total = typeof data?.total === "number" ? data.total : undefined;
            if (total !== undefined) {
                setLogHasMore(prevCount + items.length < total);
            } else {
                // Fallback heuristic: if we received a full page, more may exist
                setLogHasMore(items.length === Number(logLimit));
            }
            if (typeof page === "number") setLogPage(page);
        } catch (e) {
            setLogsError(e.message || "Failed to load logs");
            if (!merge) setLogs([]);
            setLogHasMore(false);
        } finally {
            setLogsLoading(false);
        }
    };

    const applyLogFilters = () => {
        // Always start at page 1 when applying filters
        fetchLogsWithFilters({ page: 1, merge: false });
    };

    const clearLogFilters = () => {
        setLogQuery("");
        setLogUserId("");
        setLogStart("");
        setLogEnd("");
        setLogLimit(20);
        setLogPage(1);
        setLogHasMore(false);
        // Fallback to the basic loader
        loadLogs();
    };

    const loadMoreLogs = () => {
        const nextPage = (logPage || 1) + 1;
        fetchLogsWithFilters({ page: nextPage, merge: true });
    };

    const exportLogsCSV = () => {
        if (!Array.isArray(logs) || logs.length === 0) return;
        const esc = (v) => {
            if (v == null) return "";
            const s = String(v).replace(/"/g, '""');
            return /[",\n]/.test(s) ? `"${s}"` : s;
        };
        const rows = [
            ["Timestamp", "User", "Action", "Details"],
            ...logs.map((lg) => {
                const ts = lg?.created_at || lg?.timestamp || lg?.date || "";
                const when = ts ? new Date(ts).toISOString() : "";
                const actor = (typeof displayUserName === "function" && displayUserName(lg)) || lg?.performed_by || lg?.user_email || lg?.user || "";
                const action = lg?.action || lg?.event || lg?.activity || lg?.type || "Log entry";
                const details = lg?.details || lg?.description || lg?.message || "";
                return [when, actor, action, details].map(esc);
            }),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "logs_export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const loadPreferences = () => {
        try {
            const raw = localStorage.getItem("app_prefs");
            if (raw) {
                const prefs = JSON.parse(raw);
                if (prefs.currency) setCurrency(prefs.currency);
                if (prefs.tax !== undefined) setTax(prefs.tax);
                if (prefs.invoicePrefix) setInvoicePrefix(prefs.invoicePrefix);
            }
            const caseRaw = localStorage.getItem("case_custom_prefs");
            if (caseRaw) {
                const cp = JSON.parse(caseRaw);
                setCustomCategories(Array.isArray(cp.categories) ? cp.categories : []);
                setCustomTypes(Array.isArray(cp.types) ? cp.types : []);
            }
            loadBranchDrafts();
        } catch {
            // ignore
        }
    };

    const saveCaseCustomPrefs = (nextCats, nextTypes) => {
        const payload = { categories: nextCats ?? customCategories, types: nextTypes ?? customTypes };
        localStorage.setItem("case_custom_prefs", JSON.stringify(payload));
    };

    const addCustomCategory = async (e) => {
        e.preventDefault();
        const name = newCategoryName.trim();
        if (!name) return;
        setAddCatError("");
        setAddCatLoading(true);

        const toastId = toast.loading("Adding category...", { duration: 3000 });

        try {
            const created = await fetchJson(`${API_BASE}/case-categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cc_name: name }),
            });
            // Update server list immediately
            setCategories((prev) => [created, ...prev]);
            // Optionally keep a local copy
            const next = [name, ...customCategories.filter((c) => c !== name)];

            toast.success("Category added", { id: toastId, duration: 3000 });

            setCustomCategories(next);
            saveCaseCustomPrefs(next, undefined);
            setNewCategoryName("");
        } catch (e) {
            setAddCatError(e.message || "Failed to add category");
            toast.error(e.message || "Failed to add category", { id: toastId, duration: 4000 });
        } finally {
            setAddCatLoading(false);
        }
    };

    const removeCustomCategory = (name) => {
        const next = customCategories.filter((c) => c !== name);
        setCustomCategories(next);
        saveCaseCustomPrefs(next, undefined);
    };

    const addCustomType = async (e) => {
        e.preventDefault();
        const name = newTypeName.trim();
        if (!name) return;
        setAddTypeError("");
        setAddTypeLoading(true);

        const toastId = toast.loading("Adding case type...", { duration: 3000 });

        try {
            const payload = { ct_name: name };
            const cid = newTypeCategoryId ? Number(newTypeCategoryId) : null;
            if (cid) payload.cc_id = cid;
            const created = await fetchJson(`${API_BASE}/case-category-types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            setTypes((prev) => [created, ...prev]);
            const next = [name, ...customTypes.filter((t) => t !== name)];

            toast.success("Case type added successfully", { id: toastId, duration: 3000 });

            setCustomTypes(next);
            saveCaseCustomPrefs(undefined, next);
            setNewTypeName("");
            setNewTypeCategoryId("");
        } catch (e) {
            setAddTypeError(e.message || "Failed to add type");
            toast.error(e.message || "Failed to add type", { id: toastId, duration: 4000 });
        } finally {
            setAddTypeLoading(false);
        }
    };

    const removeCustomType = (name) => {
        const next = customTypes.filter((t) => t !== name);
        setCustomTypes(next);
        saveCaseCustomPrefs(undefined, next);
    };

    useEffect(() => {
        loadCaseData();
        loadBranches();
        loadUsers();
        loadPreferences();
        loadLogs();
        loadArchiveCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tabs = [
        { key: "branch", label: "Branch", icon: Building2 },
        { key: "access", label: "Case Access", icon: Lock },
        { key: "case-categories", label: "Case Categories & Types ", icon: List },
        { key: "archive", label: "Archive", icon: Archive },
        // { key: "logs", label: "Logs & Audit Trail", icon: Info },
    ];

    // Display helpers resilient to backend shapes
    const displayType = (item) => item?.ct_name ?? item?.name ?? item?.type_name ?? item?.title ?? `Type #${item?.id ?? "?"}`;
    const displayCategory = (item) => item?.cc_name ?? item?.name ?? item?.category_name ?? item?.title ?? `Category #${item?.id ?? "?"}`;
    const displayBranchName = (b) => b?.branch_name ?? b?.name ?? b?.title ?? `Branch #${b?.id ?? "?"}`;
    const displayBranchAddress = (b) => b?.address ?? b?.branch_address ?? b?.location ?? "";
    const displayUserName = (u) =>
        [u?.user_fname, u?.user_mname, u?.user_lname].filter(Boolean).join(" ") || u?.user_email || `User #${u?.user_id ?? "?"}`;

    // New: role-based Case Access visibility
    const canSeeCaseAccess = (role) => {
        const r = (role || "").toString().toLowerCase();
        return r === "admin" || r === "lawyer";
    };
    const visibleTabs = tabs.filter((t) => t.key !== "access" || canSeeCaseAccess(user?.user_role));

    // Redirect away if user cannot access the Case Access tab
    useEffect(() => {
        if (activeTab === "access" && !canSeeCaseAccess(user?.user_role)) {
            setActiveTab("branch");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user?.user_role]);

    const copyDiagnostics = async () => {
        const payload = {
            apiBase: API_BASE,
            user: user ? { id: user.user_id, role: user.user_role } : null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            now: new Date().toISOString(),
            counts: { processingCount, archivedCount, userProcessingCount, userArchivedCount },
        };
        try {
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            alert("Diagnostics copied to clipboard.");
        } catch {
            alert("Failed to copy diagnostics.");
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <aside className="w-72 border-r bg-gradient-to-b from-white to-slate-50/80 shadow-lg sticky top-0 h-[100vh] dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
                <div className="sticky top-0 z-10 flex items-center gap-3 border-b p-4 text-lg font-semibold bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-gray-800 dark:bg-gray-900/70 dark:text-slate-200">
                    <SettingsIcon size={22} />
                    <span>Settings</span>
                </div>
                <nav className="flex flex-col gap-1 p-3 overflow-y-auto">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`group relative flex items-center gap-3 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                ? "border-blue-500/60 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800/80"}
                            `}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 space-y-8 overflow-y-auto p-6 dark:text-slate-300">
                {/* Branch */}
                {activeTab === "branch" && (
                    <div className="space-y-6">
                        {/* Add Branch Section */}
                        <SettingsCard title="Add New Branch">
                            <form
                                onSubmit={addBranchDraft}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Branch Name
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <input
                                            type="text"
                                            value={branchName}
                                            onChange={(e) => setBranchName(e.target.value)}
                                            placeholder="Enter branch name (e.g., Main Office)"
                                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        />
                                        <button
                                            type="submit"
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Plus size={16} />
                                            Add Branch
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Pending Branches List */}
                            {branchDrafts.length > 0 && (
                                <div className="pt-6 border-t mt-4 dark:border-gray-700">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Pending Branches (Local)
                                    </h3>
                                    <ul className="space-y-3">
                                        {branchDrafts.map((d) => (
                                            <li
                                                key={d.id}
                                                className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {d.branch_name}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeBranchDraft(d.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                                >
                                                    <Trash2 size={14} />
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </SettingsCard>

                        {/* Existing Branches Section */}
                        <SettingsCard
                            title="Branches "
                            actions={
                                <button
                                    onClick={loadBranches}
                                    className="inline-flex items-center gap-2 rounded-lg     border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            }
                        >
                            {branchesLoading ? (
                                <p className="text-sm text-gray-500">Loading…</p>
                            ) : branchesError ? (
                                <p className="text-sm text-red-500">{branchesError}</p>
                            ) : branches.length === 0 ? (
                                <p className="text-sm text-gray-500">No branches found.</p>
                            ) : (
                                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {branches.map((b, i) => {
                                        const id = b?.branch_id ?? b?.id ?? i;
                                        const isEditing = editingBranchId === (b?.branch_id ?? b?.id);
                                        return (
                                            <li
                                                key={id}
                                                className="rounded-lg border px-3 py-2 dark:border-gray-700"
                                            >
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            value={editingBranchName}
                                                            onChange={(e) => setEditingBranchName(e.target.value)}
                                                            className="flex-1 rounded-lg border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                                                        />
                                                        <button
                                                            onClick={saveEditBranch}
                                                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEditBranch}
                                                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <div className="font-medium">{displayBranchName(b)}</div>
                                                            {displayBranchAddress(b) && <div className="text-xs text-gray-500">{displayBranchAddress(b)}</div>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => startEditBranch(b)}
                                                                className="rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const bid = b?.branch_id ?? b?.id;
                                                                    if (!bid) return;
                                                                    if (window.confirm("Are you sure you want to delete this branch? This action cannot be undone.")) {
                                                                        deleteBranch(bid);
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                                                title="Delete branch"
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </SettingsCard>
                    </div>
                )
                }

                {/* Case Access */}
                {
                    activeTab === "access" &&
                    (canSeeCaseAccess(user?.user_role) ? (
                        <div className="space-y-6">
                            <SettingsCard
                                title="Case Access"
                                actions={
                                    <button
                                        onClick={loadUsers}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                }
                            >
                                {usersLoading ? (
                                    <p className="text-sm text-gray-500">Loading…</p>
                                ) : usersError ? (
                                    <p className="text-sm text-red-500">{usersError}</p>
                                ) : users.length === 0 ? (
                                    <p className="text-sm text-gray-500">No users found.</p>
                                ) : (
                                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {users.map((u) => (
                                            <li
                                                key={u.user_id ?? u.id}
                                                className="rounded-lg border px-3 py-2 dark:border-gray-700"
                                            >
                                                <div className="font-medium">{displayUserName(u)}</div>
                                                <div className="text-xs text-gray-500">{u?.user_role || "—"}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="mt-2 text-xs text-gray-500">User access is managed in the backend. This list is read-only.</p>
                            </SettingsCard>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <SettingsCard title="Case Access">
                                <p className="text-sm text-gray-500">Your role does not have access to this section.</p>
                            </SettingsCard>
                        </div>
                    ))
                }

                {/* Archive */}
                {
                    activeTab === "archive" && (
                        <div className="space-y-6">
                            <SettingsCard
                                title="Archive"
                                actions={
                                    <button
                                        onClick={loadArchiveCounts}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                }
                            >
                                {archiveCountsLoading ? (
                                    <p className="text-sm text-gray-500">Loading…</p>
                                ) : archiveCountsError ? (
                                    <p className="text-sm text-red-500">{archiveCountsError}</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-lg border bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                                            <div className="text-xs text-gray-500">All Processing</div>
                                            <div className="mt-1 text-2xl font-semibold">{processingCount ?? 0}</div>
                                        </div>
                                        <div className="rounded-lg border bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                                            <div className="text-xs text-gray-500">All Archived</div>
                                            <div className="mt-1 text-2xl font-semibold">{archivedCount ?? 0}</div>
                                        </div>
                                        {user && (
                                            <>
                                                <div className="rounded-lg border bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                                                    <div className="text-xs text-gray-500">My Processing</div>
                                                    <div className="mt-1 text-2xl font-semibold">{userProcessingCount ?? 0}</div>
                                                </div>
                                                <div className="rounded-lg border bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                                                    <div className="text-xs text-gray-500">My Archived</div>
                                                    <div className="mt-1 text-2xl font-semibold">{userArchivedCount ?? 0}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500">Counts are based on current server data.</p>
                            </SettingsCard>
                        </div>
                    )
                }

                {/* Case Preferences */}
                {
                    activeTab === "case-categories" && (
                        <div className="mx-auto max-w-6xl space-y-6">
                            <SettingsCard
                                title="Case Categories & Types"
                                actions={
                                    <button
                                        onClick={loadCaseData}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                }
                            >
                                <div className="space-y-8">
                                    {/* Add Case Category */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Add Case Category</h3>
                                        <form
                                            onSubmit={addCustomCategory}
                                            className="mb-2 flex items-stretch gap-2"
                                        >
                                            <input
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="e.g., Civil, Criminal, Family"
                                                className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newCategoryName.trim() || addCatLoading}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {addCatLoading ? (
                                                    "Adding..."
                                                ) : (
                                                    <>
                                                        <Plus size={16} /> Add
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                        {addCatError && <p className="text-xs text-red-500">{addCatError}</p>}
                                    </div>

                                    {/* Add Case Type */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Add Case Type</h3>
                                        <form
                                            onSubmit={addCustomType}
                                            className="mb-2 flex flex-col gap-2 sm:flex-row"
                                        >
                                            <input
                                                value={newTypeName}
                                                onChange={(e) => setNewTypeName(e.target.value)}
                                                placeholder="e.g., Theft, Contract Dispute"
                                                className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                            />
                                            <select
                                                value={newTypeCategoryId}
                                                onChange={(e) => setNewTypeCategoryId(e.target.value)}
                                                className="rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 sm:w-64"
                                            >
                                                <option value="">No category (optional)</option>
                                                {categories.map((c) => (
                                                    <option
                                                        key={c.cc_id ?? c.id}
                                                        value={c.cc_id ?? c.id}
                                                    >
                                                        {displayCategory(c)}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="submit"
                                                disabled={!newTypeName.trim() || addTypeLoading}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {addTypeLoading ? (
                                                    "Adding..."
                                                ) : (
                                                    <>
                                                        <Plus size={16} /> Add
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                        {addTypeError && <p className="text-xs text-red-500">{addTypeError}</p>}
                                    </div>

                                    {/* Case Categories (Server) */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Case Categories</h3>
                                        {caseLoading ? (
                                            <p className="text-sm text-gray-500">Loading…</p>
                                        ) : caseError ? (
                                            <p className="text-sm text-red-500">{caseError}</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {categories.map((c, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="rounded-full border bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                                                    >
                                                        {displayCategory(c)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Case Types (Server) */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Case Types</h3>
                                        {caseLoading ? (
                                            <p className="text-sm text-gray-500">Loading…</p>
                                        ) : caseError ? (
                                            <p className="text-sm text-red-500">{caseError}</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {types.map((t, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="rounded-full border bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                                                    >
                                                        {displayType(t)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </SettingsCard>
                        </div>
                    )
                }

                {/* Logs & Audit Trail */}
                {
                    // activeTab === "logs" && (
                    //     <div className="space-y-6">
                    //         <SettingsCard
                    //             title="Logs & Audit Trail"
                    //             actions={
                    //                 <button
                    //                     onClick={loadLogs}
                    //                     className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    //                 >
                    //                     <RefreshCw size={14} /> Refresh
                    //                 </button>
                    //             }
                    //         >
                    //             {/* Filters */}
                    //             <div className="space-y-3">
                    //                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    //                     <input
                    //                         value={logQuery}
                    //                         onChange={(e) => setLogQuery(e.target.value)}
                    //                         placeholder="Search action/details"
                    //                         className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    //                     />
                    //                     <input
                    //                         type="number"
                    //                         value={logUserId}
                    //                         onChange={(e) => setLogUserId(e.target.value)}
                    //                         placeholder="User ID (optional)"
                    //                         className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    //                     />
                    //                     <input
                    //                         type="date"
                    //                         value={logStart}
                    //                         onChange={(e) => setLogStart(e.target.value)}
                    //                         className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    //                     />
                    //                     <input
                    //                         type="date"
                    //                         value={logEnd}
                    //                         onChange={(e) => setLogEnd(e.target.value)}
                    //                         className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    //                     />
                    //                 </div>
                    //                 <div className="flex flex-wrap items-center gap-2">
                    //                     <select
                    //                         value={logLimit}
                    //                         onChange={(e) => setLogLimit(Number(e.target.value) || 20)}
                    //                         className="rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    //                     >
                    //                         <option value={10}>10 per page</option>
                    //                         <option value={20}>20 per page</option>
                    //                         <option value={50}>50 per page</option>
                    //                     </select>
                    //                     <button
                    //                         onClick={applyLogFilters}
                    //                         className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                    //                         disabled={logsLoading}
                    //                     >
                    //                         Apply
                    //                     </button>
                    //                     <button
                    //                         onClick={clearLogFilters}
                    //                         className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    //                         disabled={logsLoading}
                    //                     >
                    //                         Clear
                    //                     </button>
                    //                     <button
                    //                         onClick={exportLogsCSV}
                    //                         className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    //                     >
                    //                         Export CSV
                    //                     </button>
                    //                 </div>
                    //             </div>

                    //             {logsLoading ? (
                    //                 <p className="text-sm text-gray-500">Loading…</p>
                    //             ) : logsError ? (
                    //                 <p className="text-sm text-red-500">{logsError}</p>
                    //             ) : logs.length === 0 ? (
                    //                 <p className="text-sm text-gray-500">No logs found.</p>
                    //             ) : (
                    //                 <ul className="space-y-2">
                    //                     {logs.map((lg, idx) => {
                    //                         const ts = lg?.created_at || lg?.timestamp || lg?.date;
                    //                         const when = ts ? new Date(ts).toLocaleString() : "";
                    //                         const actor =
                    //                             (typeof displayUserName === "function" && displayUserName(lg)) ||
                    //                             lg?.performed_by ||
                    //                             lg?.user_email ||
                    //                             lg?.user ||
                    //                             "—";
                    //                         const action = lg?.action || lg?.event || lg?.activity || lg?.type || "Log entry";
                    //                         const details = lg?.details || lg?.description || lg?.message || "";
                    //                         return (
                    //                             <li
                    //                                 key={lg?.log_id ?? lg?.id ?? idx}
                    //                                 className="rounded-lg border px-3 py-2 dark:border-gray-700"
                    //                             >
                    //                                 <div className="font-medium">{action}</div>
                    //                                 <div className="text-xs text-gray-500">
                    //                                     {when}
                    //                                     {actor ? ` • ${actor}` : ""}
                    //                                 </div>
                    //                                 {details && <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{details}</div>}
                    //                             </li>
                    //                         );
                    //                     })}
                    //                 </ul>
                    //             )}

                    //             {logHasMore && !logsLoading && (
                    //                 <div className="mt-3 flex justify-center">
                    //                     <button
                    //                         onClick={loadMoreLogs}
                    //                         className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    //                     >
                    //                         Load more
                    //                     </button>
                    //                 </div>
                    //             )}

                    //             <p className="mt-2 text-xs text-gray-500">Showing latest 50 entries or filtered results.</p>
                    //         </SettingsCard>
                    //     </div>
                    // )
                }
            </main >
        </div >
    );
};

export default Settings;