import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const nameOf = (u) => [u?.user_fname, u?.user_mname, u?.user_lname].filter(Boolean).join(" ") || u?.user_email || `User #${u?.user_id ?? "?"}`;

export default function CaseAccessBoard({ users = [], apiBase = "", currentUserRole = "", onAfterChange }) {
    const [board, setBoard] = useState({ admin: [], lawyer: [] });

    useEffect(() => {
        const admin = users.filter((u) => (u?.user_role || "").toLowerCase() === "admin");
        const lawyer = users.filter((u) => (u?.user_role || "").toLowerCase() === "lawyer");
        setBoard({ admin, lawyer });
    }, [users]);

    const hasAdmin = (board.admin || []).length > 0;
    const canDrag = (() => {
        const r = (currentUserRole || "").toLowerCase();
        if (r === "admin") return true;
        if (r === "lawyer" && !hasAdmin) return true; // allow first admin assignment if none exists
        return false;
    })();

    const persistRole = async (userId, newRole) => {
        const trials = [
            { url: `${apiBase}/users/${userId}`, method: "PUT", body: { user_role: newRole } },
            { url: `${apiBase}/users/${userId}/role`, method: "PUT", body: { user_role: newRole } },
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

    const onDragStart = (fromCol, id) => (e) => {
        try {
            e.dataTransfer.setData("text/userId", String(id));
            e.dataTransfer.setData("text/fromCol", String(fromCol));
        } catch { }
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (toCol) => async (e) => {
        e.preventDefault();
        if (!canDrag) {
            toast.error("You do not have permission to change roles.");
            return;
        }
        const userIdStr = e.dataTransfer.getData("text/userId");
        const fromCol = e.dataTransfer.getData("text/fromCol");
        if (!userIdStr || !fromCol) return;
        if (fromCol === toCol) return;
        const uid = Number(userIdStr);

        const fromList = Array.from(board[fromCol] || []);
        const toList = Array.from(board[toCol] || []);
        const idx = fromList.findIndex((u) => (u?.user_id ?? u?.id) === uid);
        if (idx < 0) return;
        const [moved] = fromList.splice(idx, 1);
        const prev = board;
        const next = { ...board, [fromCol]: fromList, [toCol]: [...toList, moved] };
        setBoard(next);
        try {
            await persistRole(uid, toCol);
            toast.success(`${nameOf(moved)} is now ${toCol}.`);
            onAfterChange?.();
        } catch (e) {
            setBoard(prev);
            toast.error(e.message || "Failed to update role");
        }
    };

    return (
        <div className="mt-6 space-y-2">
            {!canDrag && (
                <p className="text-xs text-amber-600">Only Admin can drag. If no Admin exists, a Lawyer may assign the first Admin.</p>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Admin Column */}
                <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Admin</h3>
                        <span className="text-xs text-gray-500">{board.admin?.length || 0}</span>
                    </div>
                    <div
                        onDragOver={onDragOver}
                        onDrop={onDrop("admin")}
                        className="min-h-[240px] rounded-xl border border-blue-200/70 bg-blue-50/30 p-3 transition dark:border-blue-900/50 dark:bg-blue-950/20"
                    >
                        {(board.admin || []).map((u) => {
                            const uid = u?.user_id ?? u?.id;
                            return (
                                <div
                                    key={`admin-${uid}`}
                                    draggable={canDrag}
                                    onDragStart={onDragStart("admin", uid)}
                                    className={`mb-2 rounded-lg border px-3 py-2 text-sm shadow-sm last:mb-0 dark:border-gray-700 ${canDrag ? "cursor-move bg-white dark:bg-gray-900" : "cursor-not-allowed opacity-70 bg-white dark:bg-gray-900"
                                        }`}
                                >
                                    <div className="font-medium">{nameOf(u)}</div>
                                    <div className="text-xs text-gray-500">{u?.user_role || "—"}</div>
                                </div>
                            );
                        })}
                        {(board.admin || []).length === 0 && (
                            <div className="py-6 text-center text-xs text-gray-400">Drop here</div>
                        )}
                    </div>
                </div>

                {/* Lawyer Column */}
                <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Lawyer</h3>
                        <span className="text-xs text-gray-500">{board.lawyer?.length || 0}</span>
                    </div>
                    <div
                        onDragOver={onDragOver}
                        onDrop={onDrop("lawyer")}
                        className="min-h-[240px] rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 transition dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    >
                        {(board.lawyer || []).map((u) => {
                            const uid = u?.user_id ?? u?.id;
                            return (
                                <div
                                    key={`lawyer-${uid}`}
                                    draggable={canDrag}
                                    onDragStart={onDragStart("lawyer", uid)}
                                    className={`mb-2 rounded-lg border px-3 py-2 text-sm shadow-sm last:mb-0 dark:border-gray-700 ${canDrag ? "cursor-move bg-white dark:bg-gray-900" : "cursor-not-allowed opacity-70 bg-white dark:bg-gray-900"
                                        }`}
                                >
                                    <div className="font-medium">{nameOf(u)}</div>
                                    <div className="text-xs text-gray-500">{u?.user_role || "—"}</div>
                                </div>
                            );
                        })}
                        {(board.lawyer || []).length === 0 && (
                            <div className="py-6 text-center text-xs text-gray-400">Drop here</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
