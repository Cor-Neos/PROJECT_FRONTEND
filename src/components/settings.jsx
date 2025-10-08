import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, List, RefreshCw, Building2, Lock, Archive, Info, Trash2, Plus, } from "lucide-react";
import { useAuth } from "@/context/auth-context";

// Simple reusable section card
const SettingsCard = ({ title, actions, children }) => (
    <section>
        <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            {actions}
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 space-y-6">
            {children}
        </div>
    </section>
);

const API_BASE = "http://localhost:3000/api";

const Settings = () => {
    const [activeTab, setActiveTab] = useState("organization");
    const { user } = useAuth?.() || { user: null };

    // Case data (from backend)
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [caseLoading, setCaseLoading] = useState(false);
    const [caseError, setCaseError] = useState("");

    // Organization (branches from backend)
    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [branchesError, setBranchesError] = useState("");

    // Local branch drafts
    const [branchDrafts, setBranchDrafts] = useState([]);
    const [branchName, setBranchName] = useState("");
    const [branchAddress, setBranchAddress] = useState("");
    const [branchEmail, setBranchEmail] = useState("");
    const [branchPhone, setBranchPhone] = useState("");

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
    const [logEnd, setLogEnd] = useState("");     // yyyy-mm-dd
    const [logPage, setLogPage] = useState(1);
    const [logLimit, setLogLimit] = useState(20);
    const [logHasMore, setLogHasMore] = useState(false);

    // --- Helpers ---
    const fetchJson = async (url, opts = {}) => {
        const res = await fetch(url, { credentials: "include", ...opts });
        if (!res.ok) throw new Error((await res.text()) || "Request failed");
        return res.json();
    };

    const loadCaseData = async () => {
        setCaseError("");
        setCaseLoading(true);
        try {
            const [cat, typ] = await Promise.all([
                fetchJson(`${API_BASE}/case-categories`),
                fetchJson(`${API_BASE}/case-category-types`),
            ]);
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
    const addBranchDraft = (e) => {
        e.preventDefault();
        if (!branchName.trim()) return;
        const draft = {
            id: Date.now(),
            branch_name: branchName.trim(),
            address: branchAddress.trim(),
            email: branchEmail.trim(),
            phone: branchPhone.trim(),
            created_at: new Date().toISOString(),
        };
        const next = [draft, ...branchDrafts];
        saveBranchDrafts(next);
        setBranchName("");
        setBranchAddress("");
        setBranchEmail("");
        setBranchPhone("");
    };
    const removeBranchDraft = (id) => {
        const next = branchDrafts.filter((d) => d.id !== id);
        saveBranchDrafts(next);
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
            const [proc, arch] = await Promise.all([
                fetchJson(`${API_BASE}/cases/count/processing`),
                fetchJson(`${API_BASE}/cases/count/archived`),
            ]);
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
                const actor = (typeof displayUserName === 'function' && displayUserName(lg)) || lg?.performed_by || lg?.user_email || lg?.user || "";
                const action = lg?.action || lg?.event || lg?.activity || lg?.type || "Log entry";
                const details = lg?.details || lg?.description || lg?.message || "";
                return [when, actor, action, details].map(esc);
            })
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
            setCustomCategories(next);
            saveCaseCustomPrefs(next, undefined);
            setNewCategoryName("");
        } catch (e) {
            setAddCatError(e.message || "Failed to add category");
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
            setCustomTypes(next);
            saveCaseCustomPrefs(undefined, next);
            setNewTypeName("");
            setNewTypeCategoryId("");
        } catch (e) {
            setAddTypeError(e.message || "Failed to add type");
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
        { key: "organization", label: "Organization", icon: Building2 },
        { key: "access", label: "Case Access", icon: Lock },
        { key: "case-categories", label: "Case Categories & Types ", icon: List },
        { key: "archive", label: "Archive", icon: Archive },
        { key: "logs", label: "Logs & Audit Trail", icon: Info },
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
            setActiveTab("organization");
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
            <aside className="w-72 bg-white dark:bg-gray-900 border-r dark:border-gray-700 shadow-md">
                <div className="p-4 font-semibold text-lg border-b dark:text-slate-300 dark:border-gray-700 flex items-center gap-2">
                    <SettingsIcon size={22} />
                    <span>Settings</span>
                </div>
                <nav className="flex flex-col p-2 space-y-1">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium ${activeTab === tab.key
                                ? "bg-blue-600 text-white shadow-md"
                                : "hover:bg-blue-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto space-y-8 dark:text-slate-300">
                {/* Organization */}
                {activeTab === "organization" && (
                    <div className="space-y-6">
                        <SettingsCard
                            title="Branches (Server)"
                            actions={
                                <button
                                    onClick={loadBranches}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
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
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {branches.map((b, i) => (
                                        <li key={i} className="px-3 py-2 rounded-lg border dark:border-gray-700">
                                            <div className="font-medium">{displayBranchName(b)}</div>
                                            {displayBranchAddress(b) && (
                                                <div className="text-xs text-gray-500">{displayBranchAddress(b)}</div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SettingsCard>

                        <SettingsCard title="Add Branch (Local Draft)">
                            <form onSubmit={addBranchDraft} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Branch Name</label>
                                    <input
                                        value={branchName}
                                        onChange={(e) => setBranchName(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        placeholder="e.g., Main Office"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Address</label>
                                    <input
                                        value={branchAddress}
                                        onChange={(e) => setBranchAddress(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        placeholder="Street, City"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        value={branchEmail}
                                        onChange={(e) => setBranchEmail(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        placeholder="contact@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Phone</label>
                                    <input
                                        value={branchPhone}
                                        onChange={(e) => setBranchPhone(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        placeholder="+63 900 000 0000"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <Plus size={16} /> Add Draft
                                    </button>
                                </div>
                            </form>
                            {branchDrafts.length > 0 ? (
                                <div className="pt-2">
                                    <h3 className="text-sm font-medium mb-2">Pending Branches (local)</h3>
                                    <ul className="space-y-2">
                                        {branchDrafts.map((d) => (
                                            <li key={d.id} className="flex items-center justify-between rounded-lg border dark:border-gray-700 px-3 py-2">
                                                <div>
                                                    <div className="font-medium">{d.branch_name}</div>
                                                    <div className="text-xs text-gray-500">{d.address} {d.email && `• ${d.email}`} {d.phone && `• ${d.phone}`}</div>
                                                </div>
                                                <button onClick={() => removeBranchDraft(d.id)} className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 text-sm">
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-xs text-gray-500 mt-2">Drafts are saved in this browser only. Ask an admin to add branches in the backend.</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">No local drafts yet.</p>
                            )}
                        </SettingsCard>
                    </div>
                )}

                {/* Case Access */}
                {activeTab === "access" && (
                    canSeeCaseAccess(user?.user_role) ? (
                        <div className="space-y-6">
                            <SettingsCard
                                title="Case Access"
                                actions={
                                    <button
                                        onClick={loadUsers}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
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
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {users.map((u) => (
                                            <li key={u.user_id ?? u.id} className="px-3 py-2 rounded-lg border dark:border-gray-700">
                                                <div className="font-medium">{displayUserName(u)}</div>
                                                <div className="text-xs text-gray-500">{u?.user_role || "—"}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="text-xs text-gray-500 mt-2">User access is managed in the backend. This list is read-only.</p>
                            </SettingsCard>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <SettingsCard title="Case Access">
                                <p className="text-sm text-gray-500">Your role does not have access to this section.</p>
                            </SettingsCard>
                        </div>
                    )
                )}

                {/* Archive */}
                {activeTab === "archive" && (
                    <div className="space-y-6">
                        <SettingsCard
                            title="Archive"
                            actions={
                                <button
                                    onClick={loadArchiveCounts}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-lg border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
                                        <div className="text-xs text-gray-500">All Processing</div>
                                        <div className="mt-1 text-2xl font-semibold">{processingCount ?? 0}</div>
                                    </div>
                                    <div className="p-4 rounded-lg border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
                                        <div className="text-xs text-gray-500">All Archived</div>
                                        <div className="mt-1 text-2xl font-semibold">{archivedCount ?? 0}</div>
                                    </div>
                                    {user && (
                                        <>
                                            <div className="p-4 rounded-lg border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
                                                <div className="text-xs text-gray-500">My Processing</div>
                                                <div className="mt-1 text-2xl font-semibold">{userProcessingCount ?? 0}</div>
                                            </div>
                                            <div className="p-4 rounded-lg border dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
                                                <div className="text-xs text-gray-500">My Archived</div>
                                                <div className="mt-1 text-2xl font-semibold">{userArchivedCount ?? 0}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Counts are based on current server data.</p>
                        </SettingsCard>
                    </div>
                )}

                {/* Case Preferences */}
                {activeTab === "case-categories" && (
                    <div className="space-y-6">
                        <SettingsCard
                            title="Case Categories & Types"
                            actions={
                                <button
                                    onClick={loadCaseData}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            }
                        >
                            <div className="space-y-8">
                                {/* Add Case Category */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Add Case Category
                                    </h3>
                                    <form
                                        onSubmit={addCustomCategory}
                                        className="flex items-stretch gap-2 mb-2"
                                    >
                                        <input
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="e.g., Civil, Criminal, Family"
                                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newCategoryName.trim() || addCatLoading}
                                            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {addCatLoading ? "Adding..." : (<><Plus size={16} /> Add</>)}
                                        </button>
                                    </form>
                                    {addCatError && (
                                        <p className="text-xs text-red-500">{addCatError}</p>
                                    )}
                                </div>

                                {/* Add Case Type */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Add Case Type
                                    </h3>
                                    <form
                                        onSubmit={addCustomType}
                                        className="flex flex-col sm:flex-row gap-2 mb-2"
                                    >
                                        <input
                                            value={newTypeName}
                                            onChange={(e) => setNewTypeName(e.target.value)}
                                            placeholder="e.g., Theft, Contract Dispute"
                                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        />
                                        <select
                                            value={newTypeCategoryId}
                                            onChange={(e) => setNewTypeCategoryId(e.target.value)}
                                            className="sm:w-64 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                        >
                                            <option value="">No category (optional)</option>
                                            {categories.map((c) => (
                                                <option key={c.cc_id ?? c.id} value={c.cc_id ?? c.id}>
                                                    {displayCategory(c)}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={!newTypeName.trim() || addTypeLoading}
                                            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {addTypeLoading ? "Adding..." : (<><Plus size={16} /> Add</>)}
                                        </button>
                                    </form>
                                    {addTypeError && (
                                        <p className="text-xs text-red-500">{addTypeError}</p>
                                    )}
                                </div>

                                {/* Case Categories (Server) */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Case Categories
                                    </h3>
                                    {caseLoading ? (
                                        <p className="text-sm text-gray-500">Loading…</p>
                                    ) : caseError ? (
                                        <p className="text-sm text-red-500">{caseError}</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((c, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1.5 rounded-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                                >
                                                    {displayCategory(c)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Case Types (Server) */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Case Types
                                    </h3>
                                    {caseLoading ? (
                                        <p className="text-sm text-gray-500">Loading…</p>
                                    ) : caseError ? (
                                        <p className="text-sm text-red-500">{caseError}</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {types.map((t, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1.5 rounded-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                                >
                                                    {displayType(t)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500">
                                    New items are saved to the server and appear below.
                                </p>
                            </div>
                        </SettingsCard>
                    </div>
                )}

                {/* Logs & Audit Trail */}
                {activeTab === "logs" && (
                    <div className="space-y-6">
                        <SettingsCard
                            title="Logs & Audit Trail"
                            actions={
                                <button
                                    onClick={loadLogs}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            }
                        >
                            {/* Filters */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                    <input
                                        value={logQuery}
                                        onChange={(e) => setLogQuery(e.target.value)}
                                        placeholder="Search action/details"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    />
                                    <input
                                        type="number"
                                        value={logUserId}
                                        onChange={(e) => setLogUserId(e.target.value)}
                                        placeholder="User ID (optional)"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    />
                                    <input
                                        type="date"
                                        value={logStart}
                                        onChange={(e) => setLogStart(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    />
                                    <input
                                        type="date"
                                        value={logEnd}
                                        onChange={(e) => setLogEnd(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={logLimit}
                                        onChange={(e) => setLogLimit(Number(e.target.value) || 20)}
                                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={20}>20 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>
                                    <button
                                        onClick={applyLogFilters}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        disabled={logsLoading}
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={clearLogFilters}
                                        className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                        disabled={logsLoading}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={exportLogsCSV}
                                        className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            {logsLoading ? (
                                <p className="text-sm text-gray-500">Loading…</p>
                            ) : logsError ? (
                                <p className="text-sm text-red-500">{logsError}</p>
                            ) : logs.length === 0 ? (
                                <p className="text-sm text-gray-500">No logs found.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {logs.map((lg, idx) => {
                                        const ts = lg?.created_at || lg?.timestamp || lg?.date;
                                        const when = ts ? new Date(ts).toLocaleString() : "";
                                        const actor = (typeof displayUserName === 'function' && displayUserName(lg)) || lg?.performed_by || lg?.user_email || lg?.user || "—";
                                        const action = lg?.action || lg?.event || lg?.activity || lg?.type || "Log entry";
                                        const details = lg?.details || lg?.description || lg?.message || "";
                                        return (
                                            <li key={lg?.log_id ?? lg?.id ?? idx} className="px-3 py-2 rounded-lg border dark:border-gray-700">
                                                <div className="font-medium">{action}</div>
                                                <div className="text-xs text-gray-500">{when}{actor ? ` • ${actor}` : ""}</div>
                                                {details && (
                                                    <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">{details}</div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {logHasMore && !logsLoading && (
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={loadMoreLogs}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Load more
                                    </button>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-2">Showing latest 50 entries or filtered results.</p>
                        </SettingsCard>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Settings;
