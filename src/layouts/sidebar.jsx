import { forwardRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

import { getNavbarLinks } from "../constants";
import light_logo2 from "@/assets/light_logo2.png";
import light_logo from "@/assets/light_logo.png";
import { cn } from "@/utils/cn";

import { useAuth } from "@/context/auth-context";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
    const { user } = useAuth();
    const navbarLinks = getNavbarLinks(user?.user_role);

    const [pendingCount, setPendingCount] = useState(0);

    // 🔴 Fetch pending task count
    useEffect(() => {
        if (!user) return;

        const fetchPendingCount = async () => {
            try {
                const url =
                    user.user_role === "Admin"
                        ? "http://localhost:3000/api/documents/count/pending-tasks"
                        : `http://localhost:3000/api/documents/count/pending-tasks/${user.user_id}`;

                const res = await fetch(url, { credentials: "include" });
                const data = await res.json();

                setPendingCount(data.count || "");
            } catch (error) {
                console.error("Error fetching pending tasks count:", error);
            }
        };

        fetchPendingCount();

        // Optional: Auto-refresh every 1 minute
        const interval = setInterval(fetchPendingCount, 60000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-100 flex h-full w-[240px] flex-col overflow-x-hidden rounded-lg bg-[#1c3482] p-3 text-white shadow-md transition-all dark:bg-slate-900",
                collapsed ? "p-0 md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:left-full" : "max-md:left-0",
            )}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-center gap-x-3 p-3 border-b border-white/20 pb-3 pt-3">
                <img
                    src={light_logo2}
                    alt="legalvault_logo_light"
                    className="h-16 w-22 dark:hidden "
                />
                <img
                    src={light_logo2}
                    alt="legalvault_logo_dark"
                    className="h-16 w-25 hidden dark:block"
                />

                {!collapsed && (
                    <p className="font-serif text-2xl font-bold tracking-wide text-white drop-shadow-lg">
                        Legal Vault
                    </p>
                )}


            </div>
            {/* Navigation Links */}
            <div className="flex flex-col gap-y-3 px-2 pb-6 mt-6">
                {navbarLinks.map((link) => {
                    const isTaskLink = link.label === "Tasks";

                    return (
                        <NavLink
                            key={link.label}
                            to={link.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-x-3 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition-all duration-300",
                                    "shadow-lg",
                                    "bg-white/10 dark:bg-white/5",
                                    "hover:translate-x-1 hover:scale-[1.02] hover:shadow-lg hover:bg-white/50 hover:text-[#1c3482] dark:hover:bg-white/50 dark:hover:text-white",
                                    isActive ? "bg-white/100 text-[#1c3482] dark:bg-white/100" : "text-white",
                                    collapsed && "justify-center px-2",
                                )
                            }
                        >
                            {/* Icon */}
                            <div className="relative">
                                <link.icon
                                    size={22}
                                    className="flex-shrink-0"
                                />

                                {isTaskLink && pendingCount && collapsed > 0 && (
                                    <span
                                        className={cn("absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500", collapsed ? "md:left-4" : "")}
                                    ></span>
                                )}
                            </div>

                            {/* Label */}
                            {!collapsed && (
                                <p className="whitespace-nowrap items-center">
                                    {link.label}
                                    {isTaskLink && pendingCount > 0 && (
                                        <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                                            {pendingCount}
                                        </span>
                                    )}
                                </p>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};
