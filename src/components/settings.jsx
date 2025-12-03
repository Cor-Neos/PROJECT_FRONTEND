import React, { useEffect, useState } from "react";
import {
    Settings as SettingsIcon,
    List,
    RefreshCw,
    Building2,
    Lock,
    Archive,
    Info,
    Trash2,
    Plus,
    Eye,
    Calendar,
    User,
    CreditCard,
    Edit2,
    Tags,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import CaseAccessBoard from "@/components/case-access/case-access-board";
import ViewModal from "./view-case";

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
    const { user } = useAuth();

    // Set default tab based on user role
    const getDefaultTab = (userRole) => {
        const role = (userRole || "").toString().toLowerCase();
        if (role === "paralegal") {
            return "archive";
        }
        return "branch";
    };

    const [activeTab, setActiveTab] = useState(() => getDefaultTab(user?.user_role));

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
    const [branchDateOpened, setBranchDateOpened] = useState("");

    const [caseTags, setCaseTags] = useState([]);
    const [caseTagsLoading, setCaseTagsLoading] = useState(false);
    const [caseTagsError, setCaseTagsError] = useState("");

    const [caseTagDrafts, setCaseTagDrafts] = useState([]);
    const [caseTagName, setCaseTagName] = useState("");
    const [caseTagSequence, setCaseTagSequence] = useState("");

    // New: edit states for branch PUT
    const [editingBranchId, setEditingBranchId] = useState(null);
    const [editingBranchName, setEditingBranchName] = useState("");
    const [editingBranchAddress, setEditingBranchAddress] = useState("");
    const [editingBranchDateOpened, setEditingBranchDateOpened] = useState("");

    // Case preferences (local)
    const [customCategories, setCustomCategories] = useState([]);
    const [customTypes, setCustomTypes] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newTypeName, setNewTypeName] = useState("");
    const [newTypeMinFee, setNewTypeMinFee] = useState("");
    const [newTypeMaxFee, setNewTypeMaxFee] = useState("");

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

    // Add archived cases specific state
    const [archivedCases, setArchivedCases] = useState([]);
    const [archivedCasesLoading, setArchivedCasesLoading] = useState(false);
    const [archivedCasesError, setArchivedCasesError] = useState("");
    const [selectedCase, setSelectedCase] = useState(null);
    const [archiveSearch, setArchiveSearch] = useState("");
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [selectedAccessCase, setSelectedAccessCase] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Users (for Case Access overview)
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");

    // New: edit states for case tag PUT
    const [editingCaseTagId, setEditingCaseTagId] = useState(null);
    const [editingCaseTagName, setEditingCaseTagName] = useState("");
    const [editingCaseTagSequence, setEditingCaseTagSequence] = useState("");

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
            console.log("Branch data received:", data); // Debug log
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
        const address = branchAddress.trim();
        const dateOpened = branchDateOpened;

        const toastId = toast.loading("Adding branch...", { duration: 3000 });
        try {
            const payload = {
                branch_name: name,
                ...(address && { address }),
                ...(dateOpened && { date_opened: dateOpened }),
            };

            const created = await fetchJson(`${API_BASE}/branches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            // Optimistically add to list
            setBranches((prev) => [created, ...prev]);
            toast.success("Branch added", { id: toastId, duration: 3000 });
            setBranchName("");
            setBranchAddress("");
            setBranchDateOpened("");
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
        setEditingBranchAddress(b?.address ?? "");
        setEditingBranchDateOpened(b?.date_opened ? b.date_opened.split("T")[0] : "");
    };

    const cancelEditBranch = () => {
        setEditingBranchId(null);
        setEditingBranchName("");
        setEditingBranchAddress("");
        setEditingBranchDateOpened("");
    };

    const saveEditBranch = async () => {
        const id = editingBranchId;
        const name = editingBranchName.trim();
        if (!id || !name) return;
        const toastId = toast.loading("Updating branch...", { duration: 3000 });
        try {
            const payload = {
                branch_name: name,
                address: editingBranchAddress.trim() || null,
                date_opened: editingBranchDateOpened || null,
            };

            console.log("Saving branch with payload:", payload); // Debug log

            const updated = await fetchJson(`${API_BASE}/branches/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            console.log("Updated branch response:", updated); // Debug log

            setBranches((prev) => prev.map((b) => ((b?.branch_id ?? b?.id) === id ? updated : b)));
            toast.success("Branch updated", { id: toastId, duration: 3000 });
            cancelEditBranch();
        } catch (e) {
            console.error("Error updating branch:", e); // Debug log
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

    // Add  functions after the helper functions
    const loadCaseTags = async () => {
        setCaseTagsError("");
        setCaseTagsLoading(true);
        try {
            const data = await fetchJson(`${API_BASE}/case-tags`);
            console.log("Case tag data received:", data); // Debug log
            setCaseTags(Array.isArray(data) ? data : []);
        } catch (e) {
            setCaseTagsError(e.message || "Failed to load case tags");
            setCaseTags([]);
        } finally {
            setCaseTagsLoading(false);
        }
    };

    const saveCaseTagDrafts = (list) => {
        setCaseTagDrafts(list);
        try {
            localStorage.setItem("case_tag_drafts", JSON.stringify(list));
        } catch { }
    };

    const loadCaseTagDrafts = () => {
        try {
            const raw = localStorage.getItem("case_tag_drafts");
            if (raw) setCaseTagDrafts(JSON.parse(raw));
        } catch { }
    };

    const addCaseTagDraft = async (e) => {
        e.preventDefault();
        if (!caseTagName.trim()) return;
        const name = caseTagName.trim();
        const sequence = caseTagSequence.trim();

        const toastId = toast.loading("Adding case tag...", { duration: 3000 });
        try {
            const payload = {
                ctag_name: name,
                ...(sequence && { ctag_sequence_num: parseInt(sequence) || 0 }),
            };

            const created = await fetchJson(`${API_BASE}/case-tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            // add to list
            setCaseTags((prev) => [created, ...prev]);
            toast.success("Case tag added", { id: toastId, duration: 3000 });
            setCaseTagName("");
            setCaseTagSequence("");
        } catch (e) {
            toast.error(e.message || "Failed to add case tag", { id: toastId, duration: 4000 });
        }
    };
    const removeCaseTagDraft = (id) => {
        const next = caseTagDrafts.filter((d) => d.id !== id);
        saveCaseTagDrafts(next);
    };

    // edit case tag
    const startEditCaseTag = (tag) => {
        setEditingCaseTagId(tag?.ctag_id);
        setEditingCaseTagName(tag?.ctag_name ?? "");
        setEditingCaseTagSequence(tag?.ctag_sequence_num?.toString() ?? "");
    };

    const cancelEditCaseTag = () => {
        setEditingCaseTagId(null);
        setEditingCaseTagName("");
        setEditingCaseTagSequence("");
    };

    const saveEditCaseTag = async () => {
        if (!editingCaseTagId || !editingCaseTagName.trim()) return;

        const toastId = toast.loading("Updating case tag...", { duration: 3000 });

        try {
            const payload = {
                ctag_name: editingCaseTagName.trim(),
                ctag_sequence_num: editingCaseTagSequence ? parseInt(editingCaseTagSequence) : null,
                ctag_created_by: user.user_id,
            };

            console.log("Saving case tag with payload:", payload);

            const updated = await fetchJson(`${API_BASE}/case-tags/${editingCaseTagId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            console.log("Updated case tag response:", updated);

            setCaseTags((prev) => prev.map((tag) => (tag.ctag_id === editingCaseTagId ? updated : tag)));

            toast.success("Case tag updated", { id: toastId, duration: 3000 });
            cancelEditCaseTag();
        } catch (e) {
            console.error("Error updating case tag:", e);
            toast.error(e.message || "Failed to update case tag", { id: toastId, duration: 4000 });
        }
    };
    // const deleteCaseTag = async (id) => {
    //     if (!id) return;
    //     const toastId = toast.loading("Deleting case tag...", { duration: 3000 });
    //     try {
    //         await fetchJson(`${API_BASE}/case-tags/${id}`, {
    //             method: "DELETE",
    //         });
    //         setCaseTags((prev) => prev.filter((tag) => (tag?.tag_id ?? tag?.id) !== id));
    //         toast.success("Case tag deleted", { id: toastId, duration: 3000 });
    //     } catch (e) {
    //         toast.error(e.message || "Failed to delete case tag", { id: toastId, duration: 4000 });
    //     }
    // };

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
            loadCaseTagDrafts();
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

    // adding a case type
    const addCustomType = async (e) => {
        e.preventDefault();

        const name = newTypeName.trim();
        const minFee = newTypeMinFee.trim();
        const maxFee = newTypeMaxFee.trim();

        if (!name || !minFee || !maxFee) return;

        setAddTypeError("");
        setAddTypeLoading(true);

        const toastId = toast.loading("Adding case type...");

        try {
            const payload = {
                ct_name: name,
                ct_fee: { min: Number(minFee), max: Number(maxFee) }, // send as numbers
                cc_id: newTypeCategoryId ? Number(newTypeCategoryId) : null,
            };

            const created = await fetchJson(`${API_BASE}/case-category-types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            setTypes((prev) => [created, ...prev]);

            toast.success("Case type added successfully", { id: toastId });

            // Reset fields
            setNewTypeName("");
            setNewTypeCategoryId("");
            setNewTypeMinFee("");
            setNewTypeMaxFee("");
        } catch (e) {
            setAddTypeError(e.message || "Failed to add type");
            toast.error(e.message || "Failed to add type", { id: toastId });
        } finally {
            setAddTypeLoading(false);
        }
    };

    // Add archived cases functions
    const loadArchivedCases = async () => {
        setArchivedCasesError("");
        setArchivedCasesLoading(true);
        try {
            const endpoint = user?.user_role === "Admin" ? `${API_BASE}/cases` : `${API_BASE}/cases/user/${user?.user_id}`;

            const data = await fetchJson(endpoint);
            const archived = data.filter(
                (item) =>
                    (item.case_status && item.case_status.toLowerCase() === "archived (completed)") ||
                    item.case_status.toLowerCase() === "archived (dismissed)",
            );
            setArchivedCases(archived);
        } catch (e) {
            setArchivedCasesError(e.message || "Failed to load archived cases");
            setArchivedCases([]);
        } finally {
            setArchivedCasesLoading(false);
        }
    };

    const handleCaseUpdated = (updatedCase) => {
        setArchivedCases((prev) => prev.map((c) => (c.case_id === updatedCase.case_id ? updatedCase : c)));
    };

    const handleUnarchive = async (caseToBeUnarchived) => {
        const confirm = window.confirm("Are you sure you want to unarchive this case?");
        if (!confirm) return;

        const toastId = toast.loading("Unarchiving case...", { duration: 4000 });

        try {
            const res = await fetch(`${API_BASE}/cases/${caseToBeUnarchived.case_id}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...caseToBeUnarchived,
                    case_status: "Completed",
                    last_updated_by: user.user_id,
                }),
            });

            if (!res.ok) throw new Error("Failed to unarchive case");

            setArchivedCases((prev) => prev.filter((item) => item.case_id !== caseToBeUnarchived.case_id));

            // Update archive counts
            loadArchiveCounts();

            toast.success("Case unarchived successfully.", { id: toastId, duration: 4000 });
        } catch (err) {
            console.error("Error unarchiving case:", err);
            toast.error("Error unarchiving case", { id: toastId, duration: 4000 });
        }
    };

    const getLawyerFullName = (lawyerId) => {
        const lawyer = users.find((u) => u.user_id === lawyerId);
        return lawyer
            ? `${lawyer.user_fname || ""} ${lawyer.user_mname ? lawyer.user_mname[0] + "." : ""} ${lawyer.user_lname || ""}`
                .replace(/\s+/g, " ")
                .trim()
            : "Unassigned";
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    useEffect(() => {
        loadCaseData();
        loadBranches();
        loadCaseTags();
        loadUsers();
        loadPreferences();
        loadArchiveCounts();
        if (user) {
            loadArchivedCases();
        }
    }, [user]);

    // Set initial tab when user data first becomes available
    useEffect(() => {
        if (user?.user_role) {
            const defaultTab = getDefaultTab(user.user_role);
            setActiveTab(defaultTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.user_role]); // Only run when user role changes

    const tabs = [
        { key: "branch", label: "Branch", icon: Building2 },
        { key: "access", label: "User Role", icon: Lock },
        { key: "case-categories", label: "Case Categories & Types ", icon: List },
        { key: "tags", label: "Case Tag", icon: Tags },
        { key: "archive", label: "Archive", icon: Archive },
    ];

    // Filter archived cases based on search
    const filteredArchivedCases = archivedCases.filter((item) => {
        const matchesSearch =
            item.cc_name?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            item.ct_name?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            item.client_fullname?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            item.case_id.toString().includes(archiveSearch);

        const isOwner = item.user_id === user?.user_id;
        const isAdmin = user?.user_role === "Admin";
        const isAllowed = Array.isArray(item.case_allowed_viewers) ? item.case_allowed_viewers.includes(user?.user_id) : false;

        return matchesSearch && (isOwner || isAdmin || isAllowed);
    });

    // Display helpers resilient to backend shapes
    const displayType = (item) => item?.ct_name ?? item?.name ?? item?.type_name ?? item?.title ?? `Type #${item?.id ?? "?"}`;
    const displayCategory = (item) => item?.cc_name ?? item?.name ?? item?.category_name ?? item?.title ?? `Category #${item?.id ?? "?"}`;
    const displayBranchName = (b) => b?.branch_name ?? b?.name ?? b?.title ?? `Branch #${b?.id ?? "?"}`;
    const displayBranchAddress = (b) => b?.address ?? b?.branch_address ?? b?.location ?? "";
    const displayUserName = (u) =>
        [u?.user_fname, u?.user_mname, u?.user_lname].filter(Boolean).join(" ") || u?.user_email || `User #${u?.user_id ?? "?"}`;

    // Role-based tab visibility
    const canSeeCaseAccess = (role) => {
        const r = (role || "").toString().toLowerCase();
        return r === "admin" || r === "lawyer";
    };

    const getVisibleTabs = (role) => {
        const r = (role || "").toString().toLowerCase();

        // Paralegals can only see Archive tab
        if (r === "paralegal") {
            return tabs.filter((t) => t.key === "archive");
        }

        // Admin and Lawyer can see all tabs
        if (r === "admin" || r === "lawyer") {
            return tabs;
        }

        // Staff and other roles can see all tabs except Case Access
        return tabs.filter((t) => t.key !== "access");
    };

    const visibleTabs = getVisibleTabs(user?.user_role);

    // Redirect users to appropriate default tab based on their role
    useEffect(() => {
        const userRole = (user?.user_role || "").toString().toLowerCase();

        // Redirect paralegal to archive if they're on any other tab
        if (userRole === "paralegal" && activeTab !== "archive") {
            setActiveTab("archive");
        }

        // Redirect non-admin/non-lawyer away from Case Access tab
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

    // =====================
    // Case Access Drag Board (Admin/Lawyer)
    // =====================
    const [roleBoard, setRoleBoard] = useState({ admin: [], lawyer: [] });

    useEffect(() => {
        const admins = users.filter((u) => (u?.user_role || "").toLowerCase() === "admin");
        const lawyers = users.filter((u) => (u?.user_role || "").toLowerCase() === "lawyer");
        setRoleBoard({ admin: admins, lawyer: lawyers });
    }, [users]);

    const hasAdmin = (roleBoard.admin || []).length > 0;
    const canDragRoles = (() => {
        const r = (user?.user_role || "").toLowerCase();
        if (r === "admin") return true;
        if (r === "lawyer" && !hasAdmin) return true; // allow first admin assignment if none exists
        return false;
    })();

    const persistUserRole = async (userId, newRole) => {
        const trials = [
            { url: `${API_BASE}/users/${userId}`, method: "PUT", body: { user_role: newRole } },
            { url: `${API_BASE}/users/${userId}/role`, method: "PUT", body: { user_role: newRole } },
        ];
        let lastErr;
        for (const t of trials) {
            try {
                const res = await fetch(t.url, {
                    method: t.method,
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(t.body),
                });
                if (!res.ok) throw new Error((await res.text()) || "Failed to update role");
                return true;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error("Failed to update role");
    };

    const onDragStartUser = (fromCol, id) => (e) => {
        try {
            e.dataTransfer.setData("text/userId", String(id));
            e.dataTransfer.setData("text/fromCol", String(fromCol));
        } catch { }
    };

    const onDragOverCol = (e) => {
        e.preventDefault();
    };

    const onDropToCol = (toCol) => async (e) => {
        e.preventDefault();
        if (!canDragRoles) {
            toast.error("You do not have permission to change roles.");
            return;
        }
        const userIdStr = e.dataTransfer.getData("text/userId");
        const fromCol = e.dataTransfer.getData("text/fromCol");
        if (!userIdStr || !fromCol) return;
        if (fromCol === toCol) return;
        const uid = Number(userIdStr);

        const fromList = Array.from(roleBoard[fromCol] || []);
        const toList = Array.from(roleBoard[toCol] || []);
        const idx = fromList.findIndex((u) => (u?.user_id ?? u?.id) === uid);
        if (idx < 0) return;
        const [moved] = fromList.splice(idx, 1);
        const prev = roleBoard;
        // Optimistically append to end of destination
        const next = { ...roleBoard, [fromCol]: fromList, [toCol]: [...toList, moved] };
        setRoleBoard(next);
        try {
            await persistUserRole(uid, toCol);
            toast.success(`${displayUserName(moved)} is now ${toCol}.`);
            // Also refresh base list to keep in sync
            loadUsers();
        } catch (e) {
            setRoleBoard(prev);
            toast.error(e.message || "Failed to update role");
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <aside className="sticky top-0 h-[80vh] w-72 border-r bg-gradient-to-b from-white to-slate-50/80 shadow-lg dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
                <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/70 p-4 text-lg font-semibold backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-gray-800 dark:bg-gray-900/70 dark:text-slate-200">
                    <SettingsIcon size={22} />
                    <span>Settings</span>
                </div>
                <nav className="flex flex-col gap-1 overflow-y-auto p-3">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`group relative flex items-center gap-3 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                ? "border-blue-500/60 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800/80"
                                } `}
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
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Branch Name *</label>
                                        <input
                                            type="text"
                                            value={branchName}
                                            onChange={(e) => setBranchName(e.target.value)}
                                            placeholder="Enter branch name (e.g., Main Office)"
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Address</label>
                                        <input
                                            type="text"
                                            value={branchAddress}
                                            onChange={(e) => setBranchAddress(e.target.value)}
                                            placeholder="Enter branch address"
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date Opened</label>
                                        <input
                                            type="date"
                                            value={branchDateOpened}
                                            onChange={(e) => setBranchDateOpened(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="flex items-end">
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
                                <div className="mt-4 border-t pt-6 dark:border-gray-700">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Pending Branches (Local)</h3>
                                    <ul className="space-y-3">
                                        {branchDrafts.map((d) => (
                                            <li
                                                key={d.id}
                                                className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{d.branch_name}</div>
                                                </div>
                                                <button
                                                    onClick={() => removeBranchDraft(d.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/30"
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
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
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
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {branches.map((b, i) => {
                                        const id = b?.branch_id ?? b?.id ?? i;
                                        const isEditing = editingBranchId === (b?.branch_id ?? b?.id);

                                        console.log("Branch object:", b); // Debug log
                                        console.log("Branch address:", displayBranchAddress(b)); // Debug log
                                        console.log("Branch date opened:", b?.date_opened); // Debug log

                                        return (
                                            <div
                                                key={id}
                                                className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                {isEditing ? (
                                                    /* Edit Mode */
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                            Edit Branch Information
                                                        </h4>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Branch Name *
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={editingBranchName}
                                                                    onChange={(e) => setEditingBranchName(e.target.value)}
                                                                    placeholder="Enter branch name"
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                                    required
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Address
                                                                </label>
                                                                <textarea
                                                                    value={editingBranchAddress}
                                                                    onChange={(e) => setEditingBranchAddress(e.target.value)}
                                                                    rows={2}
                                                                    placeholder="Enter branch address"
                                                                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Date Opened
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={editingBranchDateOpened}
                                                                    onChange={(e) => setEditingBranchDateOpened(e.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 border-t pt-2 dark:border-gray-600">
                                                            <button
                                                                onClick={saveEditBranch}
                                                                disabled={!editingBranchName.trim()}
                                                                className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                Save Changes
                                                            </button>
                                                            <button
                                                                onClick={cancelEditBranch}
                                                                className="flex-1 rounded-md bg-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* View Mode */
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                    {displayBranchName(b)}
                                                                </h3>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Branch ID: #{b?.branch_id ?? b?.id}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <button
                                                                    onClick={() => startEditBranch(b)}
                                                                    className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                                    title="Edit Branch"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const bid = b?.branch_id ?? b?.id;
                                                                        if (!bid) return;
                                                                        if (
                                                                            window.confirm(
                                                                                "Are you sure you want to delete this branch? This action cannot be undone.",
                                                                            )
                                                                        ) {
                                                                            deleteBranch(bid);
                                                                        }
                                                                    }}
                                                                    className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                                    title="Delete Branch"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                                                                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                    📍 Address
                                                                </div>
                                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {displayBranchAddress(b) || "No address provided"}
                                                                </div>
                                                                {!displayBranchAddress(b) && (
                                                                    <button
                                                                        onClick={() => startEditBranch(b)}
                                                                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                                    >
                                                                        Click to add address
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {b?.date_opened && (
                                                                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                                                    <div className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                        📅 Date Opened
                                                                    </div>
                                                                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                                        {formatDateTime(b.date_opened)}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                                                <div className="mb-1 text-xs font-medium text-green-700 dark:text-green-300">
                                                                    ✅ Status
                                                                </div>
                                                                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                                                                    Active Branch
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SettingsCard>
                    </div>
                )}

                {/* Case Access */}
                {activeTab === "access" &&
                    (canSeeCaseAccess(user?.user_role) ? (
                        <div className="space-y-6">
                            <SettingsCard
                                title="User Role"
                                actions={
                                    <button
                                        onClick={loadUsers}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                }
                            >
                                {/* Separated Case Access Drag Board */}
                                <CaseAccessBoard
                                    users={users}
                                    apiBase={API_BASE}
                                    currentUserRole={user?.user_role}
                                    onAfterChange={loadUsers}
                                />

                                {usersLoading ? (
                                    <p className="text-sm text-gray-500">Loading…</p>
                                ) : usersError ? (
                                    <p className="text-sm text-red-500">{usersError}</p>
                                ) : users.length === 0 ? (
                                    <p className="text-sm text-gray-500">No users found.</p>
                                ) : (
                                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {users
                                            .filter(
                                                (u) =>
                                                    u.user_role &&
                                                    (u.user_role.toLowerCase() === "paralegal" || u.user_role.toLowerCase() === "staff"),
                                            )
                                            .map((u) => (
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

                                <p className="mt-2 text-xs text-gray-500">User access </p>
                            </SettingsCard>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <SettingsCard title="Case Access">
                                <p className="text-sm text-gray-500">Your role does not have access to this section.</p>
                            </SettingsCard>
                        </div>
                    ))}

                {/* Archive */}
                {activeTab === "archive" && (
                    <div className="space-y-6">
                        <SettingsCard
                            title="Cases"
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

                        {/* Archived Cases List */}
                        <SettingsCard
                            title="Archived Cases"
                            actions={
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {filteredArchivedCases.length} case{filteredArchivedCases.length !== 1 ? "s" : ""}
                                    </span>
                                    <button
                                        onClick={loadArchivedCases}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                </div>
                            }
                        >
                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search archived cases..."
                                    value={archiveSearch}
                                    onChange={(e) => setArchiveSearch(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                                />
                            </div>

                            {/* Cases List */}
                            {archivedCasesLoading ? (
                                <p className="text-sm text-gray-500">Loading archived cases…</p>
                            ) : archivedCasesError ? (
                                <p className="text-sm text-red-500">{archivedCasesError}</p>
                            ) : filteredArchivedCases.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredArchivedCases.map((caseItem) => (
                                        <div
                                            key={caseItem.case_id}
                                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900 dark:text-white">Case #{caseItem.case_id}</h4>
                                                        <span
                                                            className={`rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300`}
                                                        >
                                                            {caseItem.case_status}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{caseItem.ct_name}</p>
                                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <User size={12} />
                                                            <span>{caseItem.client_fullname}</span>
                                                        </div>

                                                        {user?.user_role === "Admin" && (
                                                            <div className="flex items-center gap-1">
                                                                <span>Atty. {getLawyerFullName(caseItem.user_id)}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            <span>Archived: {formatDateTime(caseItem.case_last_updated)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedCase(caseItem)}
                                                        className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>

                                                    {(user?.user_role === "Admin" || caseItem.user_id === user?.user_id) && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAccessCase(caseItem);
                                                                setSelectedUsers(caseItem.case_allowed_viewers || []);
                                                                setShowAccessModal(true);
                                                            }}
                                                            className="flex items-center gap-1 rounded-md bg-yellow-50 px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                                                        >
                                                            <Lock size={14} />
                                                            Share Access
                                                        </button>
                                                    )}

                                                    {user?.user_role === "Admin" && (
                                                        <button
                                                            onClick={() => handleUnarchive(caseItem)}
                                                            className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                                        >
                                                            <Archive size={14} />
                                                            Unarchive
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {archiveSearch ? "No archived cases match your search." : "No archived cases found."}
                                    </div>
                                </div>
                            )}
                        </SettingsCard>
                    </div>
                )}

                {/* Case Categories and its Subtypes*/}
                {activeTab === "case-categories" && (
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
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <input
                                                type="number"
                                                value={newTypeMinFee}
                                                onChange={(e) => setNewTypeMinFee(e.target.value)}
                                                placeholder="Min Fee"
                                                className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                            />

                                            <input
                                                type="number"
                                                value={newTypeMaxFee}
                                                onChange={(e) => setNewTypeMaxFee(e.target.value)}
                                                placeholder="Max Fee"
                                                className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                            />
                                        </div>

                                        <select
                                            value={newTypeCategoryId}
                                            onChange={(e) => setNewTypeCategoryId(e.target.value)}
                                            className="rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 sm:w-64"
                                        >
                                            <option
                                                value=""
                                                disabled
                                            >
                                                Select Category
                                            </option>
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
                                            disabled={!newTypeName.trim() || addTypeLoading || !newTypeCategoryId}
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
                )}
            </main>

            {/* Case Tags */}
            {activeTab === "tags" && (
                <div className="space-y-6">
                    {/* Add Case Tag Section */}
                    <SettingsCard title="Add New Case Tag">
                        <form
                            onSubmit={addCaseTagDraft}
                            className="space-y-6"
                        >
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tag Name *</label>
                                    <input
                                        type="text"
                                        value={caseTagName}
                                        onChange={(e) => setCaseTagName(e.target.value)}
                                        placeholder="Enter tag name (e.g., Case Intake)"
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sequence Number</label>
                                    <input
                                        type="number"
                                        value={caseTagSequence}
                                        onChange={(e) => setCaseTagSequence(e.target.value)}
                                        placeholder="Enter sequence number"
                                        min="0"
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                        Add Tag
                                    </button>
                                </div>
                            </div>
                        </form>
                    </SettingsCard>

                    {/* Existing Case Tags Section */}
                    <div className="w-full">
                        <SettingsCard
                            title="Case Tags"
                            actions={
                                <button
                                    onClick={loadCaseTags}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-slate-200"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            }
                        >
                            {caseTagsLoading ? (
                                <p className="text-sm text-gray-500">Loading…</p>
                            ) : caseTagsError ? (
                                <p className="text-sm text-red-500">{caseTagsError}</p>
                            ) : caseTags.length === 0 ? (
                                <p className="text-sm text-gray-500">No case tags found.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {caseTags.map((tag) => {
                                        const isEditing = editingCaseTagId === tag.ctag_id;

                                        return (
                                            <div
                                                key={tag.ctag_id}
                                                className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                {isEditing ? (
                                                    /* EDIT MODE */
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Edit Case Tag</h4>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Tag Name *
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={editingCaseTagName}
                                                                    onChange={(e) => setEditingCaseTagName(e.target.value)}
                                                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                    Sequence Number
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={editingCaseTagSequence}
                                                                    onChange={(e) => setEditingCaseTagSequence(e.target.value)}
                                                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 border-t pt-2">
                                                            <button
                                                                onClick={saveEditCaseTag}
                                                                className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white"
                                                            >
                                                                Save Changes
                                                            </button>

                                                            <button
                                                                onClick={cancelEditCaseTag}
                                                                className="flex-1 rounded-md bg-gray-300 px-3 py-2 text-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* VIEW MODE */
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                    {tag.ctag_name}
                                                                </h3>
                                                                <p className="text-xs text-gray-500">Sequence: #{tag.ctag_sequence_num}</p>
                                                            </div>

                                                            <button
                                                                onClick={() => startEditCaseTag(tag)}
                                                                className="rounded p-1.5 text-blue-600 opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SettingsCard>
                    </div>
                </div>
            )}

            {/* View Modal */}
            <ViewModal
                selectedCase={selectedCase}
                setSelectedCase={setSelectedCase}
                tableData={archivedCases}
                onCaseUpdated={handleCaseUpdated}
            />

            {/* Access Modal */}
            {showAccessModal && selectedAccessCase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:text-gray-200">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Lock size={18} />
                            Share Access for Case #{selectedAccessCase.case_id}
                        </h3>

                        {usersLoading ? (
                            <p className="text-sm text-gray-500">Loading users...</p>
                        ) : usersError ? (
                            <p className="text-sm text-red-500">{usersError}</p>
                        ) : (
                            <div className="max-h-64 divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
                                {users.map((u) => (
                                    <label
                                        key={u.user_id}
                                        className="flex items-center justify-between px-1 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {u.user_fname} {u.user_mname} {u.user_lname}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{u.user_role}</span>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(u.user_id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers([...selectedUsers, u.user_id]);
                                                } else {
                                                    setSelectedUsers(selectedUsers.filter((id) => id !== u.user_id));
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setShowAccessModal(false)}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        await fetch(`${API_BASE}/cases/${selectedAccessCase.case_id}/share`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            credentials: "include",
                                            body: JSON.stringify({ allowed_viewers: selectedUsers }),
                                        });

                                        toast.success("Access updated!");
                                        setArchivedCases((prev) =>
                                            prev.map((item) =>
                                                item.case_id === selectedAccessCase.case_id ? { ...item, case_allowed_viewers: selectedUsers } : item,
                                            ),
                                        );
                                        setShowAccessModal(false);
                                    } catch {
                                        toast.error("Failed to update access");
                                    }
                                }}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                            >
                                Save Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
