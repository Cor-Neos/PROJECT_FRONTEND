import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/auth-context";
import { useClickOutside } from "@/hooks/use-click-outside";
import { ProfileModal } from "../components/profile-modal";
import { getNavbarLinks } from "@/constants";

import { ChevronsLeft, Settings, Search, Sun, Moon, Bell } from "lucide-react";
import default_avatar from "@/assets/default-avatar.png";
import api from "@/utils/api";

import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import toast from "react-hot-toast";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const { logout, user, loading } = useAuth();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useClickOutside([dropdownRef], () => {
        setOpen(false);
    });

    const handleLogout = async () => {
        const toastId = toast.loading("Logging Out...");

        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            await logout();
            toast.success("Logout successful!", {
                id: toastId,
                duration: 4000,
            });
        } else {
            toast.dismiss(toastId, { duration: 4000 });
        }
    };

    const handleProfile = () => {
        setShowProfileModal(true);
    };

    // Helper: search nav links
    const searchNavLinks = (term) => {
        const links = getNavbarLinks(user?.user_role || "");
        return (links || [])
            .filter((l) => l.label.toLowerCase().includes(term.toLowerCase()))
            .map((l) => ({
                key: `nav:${l.label}`,
                type: "Navigate",
                label: l.label,
                sub: l.path,
                path: l.path,
            }));
    };

    // fetch notification unread count
    const fetchUnreadCount = async () => {
        try {
            const data = await api.get(`/notifications/unread-count/${user.user_id}`);
            setUnreadCount(data.count || 0);
        } catch (e) {
            console.error("Failed to count unread notification/s", e);
            setUnreadCount(0);
        }
    };

    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    // Global search across routes and backend entities (cases, clients, documents)
    useEffect(() => {
        let active = true;
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        const timer = setTimeout(async () => {
            try {
                const term = searchTerm.trim();
                const results = [...searchNavLinks(term)];

                // Fetch in parallel
                const [casesRes, clientsRes, docsRes] = await Promise.all([
                    api.get(`/cases/search?q=${encodeURIComponent(term)}`).catch(() => null),
                    api.get("/clients").catch(() => null),
                    api.get("/documents").catch(() => null),
                ]);

                if (!active) return;

                // Cases
                if (casesRes) {
                    const cases = casesRes;
                    (Array.isArray(cases) ? cases : []).forEach((c) => {
                        const label = c.ct_name ? `${c.ct_name} (Case #${c.case_id})` : `Case #${c.case_id}`;
                        results.push({
                            key: `case:${c.case_id}`,
                            type: "Case",
                            label,
                            sub: c.case_status ? `Status: ${c.case_status}` : undefined,
                            path: "/cases",
                        });
                    });
                }

                // Clients (filter client-side)
                if (clientsRes) {
                    const clients = clientsRes;
                    (Array.isArray(clients) ? clients : [])
                        .filter((cl) => {
                            const full = String(cl.client_fullname || `${cl.client_fname || ""} ${cl.client_lname || ""}`).toLowerCase();
                            return full.includes(term.toLowerCase());
                        })
                        .forEach((cl) => {
                            const full = cl.client_fullname || `${cl.client_fname || ""} ${cl.client_lname || ""}`.trim();
                            results.push({
                                key: `client:${cl.client_id}`,
                                type: "Client",
                                label: full || `Client #${cl.client_id}`,
                                sub: cl.client_email || cl.client_contact || undefined,
                                path: "/clients",
                            });
                        });
                }

                // Documents (filter client-side)
                if (docsRes) {
                    const docs = docsRes;
                    (Array.isArray(docs) ? docs : [])
                        .filter((d) => {
                            const hay = `${d.doc_name || ""} ${d.doc_type || ""} ${d.doc_tag || ""}`.toLowerCase();
                            return hay.includes(term.toLowerCase());
                        })
                        .forEach((d) => {
                            results.push({
                                key: `doc:${d.doc_id}`,
                                type: "Document",
                                label: d.doc_name || `Document #${d.doc_id}`,
                                sub: d.doc_type || d.doc_tag || undefined,
                                path: "/documents",
                            });
                        });
                }

                if (active) setSearchResults(results.slice(0, 20));
            } catch (e) {
                if (active) {
                    setSearchResults(searchNavLinks(searchTerm));
                }
            } finally {
                if (active) setSearchLoading(false);
            }
        }, 250); // debounce

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [searchTerm, user?.user_role]);

    // Update search term and open dropdown suggestions
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    const onSelectResult = (r) => {
        if (r?.path) {
            navigate(r.path);
            sessionStorage.setItem("globalSearch", searchTerm);
        }
        setSearchResults([]);
        setSearchTerm("");
    };

    return (
        <header className="relative z-10 ml-4 flex h-[60px] items-center justify-between rounded-lg bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft className={collapsed && "rotate-180"} />
                </button>
                <div className="input relative">
                    <Search
                        size={20}
                        className="text-slate-500"
                    />
                    <input
                        type="text"
                        name="search"
                        id="search"
                        placeholder="Search..."
                        className="w-full bg-transparent text-slate-900 outline-0 placeholder:text-slate-500 dark:text-slate-50"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    {searchTerm && (
                        <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-full overflow-auto rounded-md bg-white shadow-lg dark:bg-slate-800">
                            {searchLoading ? (
                                <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((r) => (
                                    <div
                                        key={r.key}
                                        className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900"
                                        onClick={() => onSelectResult(r)}
                                    >
                                        <span className="truncate">{r.label}</span>
                                        <span className="ml-3 text-xs text-slate-500">{r.type}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-500">No results</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative flex items-center gap-x-2">
                <button
                    className="btn-ghost size-10"
                    onClick={() => {
                        setTheme(theme === "dark" ? "light" : "dark");
                    }}
                >
                    <Sun
                        size={20}
                        className="dark:hidden"
                    />
                    <Moon
                        size={20}
                        className="hidden dark:block"
                    />
                </button>

                <button
                    onClick={() => navigate("notifications")}
                    className="btn-ghost relative size-10"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -right-[-4px] -top-[-2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => navigate("settings")}
                    className="btn-ghost size-10"
                >
                    <Settings size={20} />
                </button>

                {/* Profile Image Dropdown */}
                <div
                    className="relative"
                    ref={dropdownRef}
                >
                    <button
                        className="flex h-10 items-center rounded-full bg-blue-900 p-1 pr-0 transition hover:bg-blue-800 dark:bg-blue-950 dark:hover:bg-[#173B7E]"
                        onClick={() => setOpen(!open)}
                    >
                        <span className="px-3 text-sm font-medium text-white">
                            Hi, {user.user_role === "Admin" ? "Super Lawyer" : user.user_role}
                        </span>
                        <img
                            src={user?.user_profile ? `${api.baseUrl.replace(/\/api$/, '')}${user.user_profile}` : default_avatar}
                            alt="profile"
                            className="h-11 w-11 rounded-full object-cover outline outline-2 outline-gray-200 dark:outline-gray-500"
                        />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white p-2 shadow-lg dark:bg-slate-800">
                            <div className="max-w-full truncate px-2 py-1 text-sm font-bold text-gray-500 dark:text-gray-300">
                                {loading
                                    ? "Loading..."
                                    : user
                                        ? `${user.user_fname} ${user.user_mname ? user.user_mname[0] + "." : ""} ${user.user_lname}`
                                        : "No user"}
                            </div>
                            <button
                                onClick={handleProfile}
                                className="w-full rounded px-2 py-1 text-left text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                                Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full rounded px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};
