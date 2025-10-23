import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DndContext, useSensor, useSensors, PointerSensor, useDroppable, useDraggable, DragOverlay, } from "@dnd-kit/core";

const nameOf = (u) =>
    [u?.user_fname, u?.user_mname, u?.user_lname].filter(Boolean).join(" ") ||
    u?.user_email ||
    `User #${u?.user_id ?? "?"}`;

const uidOf = (u) => u?.user_id ?? u?.id;

function DroppableColumn({ id, title, count, className = "", children }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
                <h3
                    className={
                        id === "admin"
                            ? "text-sm font-semibold text-blue-700 dark:text-blue-300"
                            : "text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                    }
                >
                    {title}
                </h3>
                <span className="text-xs text-gray-500">{count || 0}</span>
            </div>
            <div
                ref={setNodeRef}
                className={
                    (id === "admin"
                        ? "border-blue-200/70 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20"
                        : "border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20") +
                    ` min-h-[240px] rounded-xl border p-3 transition ${isOver ? "ring-2 ring-offset-2 ring-indigo-400 dark:ring-indigo-500" : ""} ${className}`
                }
            >
                {children}
            </div>
        </div>
    );
}

function DraggableUser({ user, disabled = false, fromColumn }) {
    const id = uidOf(user);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        disabled,
        data: { from: fromColumn },
    });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`mb-2 rounded-lg border px-3 py-2 text-sm shadow-sm last:mb-0 dark:border-gray-700 ${disabled ? "cursor-not-allowed opacity-70 bg-white dark:bg-gray-900" : "cursor-move bg-white dark:bg-gray-900"
                } ${isDragging ? "opacity-50" : ""}`}
        >
            <div className="font-medium">{nameOf(user)}</div>
            <div className="text-xs text-gray-500">{user?.user_role || "—"}</div>
        </div>
    );
}

export default function CaseAccessBoard({ users = [], apiBase = "", currentUserRole = "", onAfterChange }) {
    const [board, setBoard] = useState({ admin: [], lawyer: [] });
    const [activeId, setActiveId] = useState(null);
    const [activeFrom, setActiveFrom] = useState(null);

    useEffect(() => {
        const admin = users.filter((u) => (u?.user_role || "").toLowerCase() === "admin");
        const lawyer = users.filter((u) => (u?.user_role || "").toLowerCase() === "lawyer");
        setBoard({ admin, lawyer });
    }, [users]);

    const findColForId = (id) => {
        if ((board.admin || []).some((u) => uidOf(u) === id)) return "admin";
        if ((board.lawyer || []).some((u) => uidOf(u) === id)) return "lawyer";
        return null;
    };

    const getUserById = (id) =>
        [...(board.admin || []), ...(board.lawyer || [])].find((u) => uidOf(u) === id) || null;

    const hasAdmin = (board.admin || []).length > 0;
    const canDrag = (() => {
        const r = (currentUserRole || "").toLowerCase();
        if (r === "admin") return true;
        if (r === "lawyer" && !hasAdmin) return true; // allow first admin assignment if none exists
        return false;
    })();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        })
    );

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

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active?.id ?? null);
        setActiveFrom(active?.data?.current?.from ?? findColForId(active?.id));
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setActiveFrom(null);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        const id = active?.id;
        setActiveId(null);

        if (!id || !over) return handleDragCancel();

        const toCol = over.id; // 'admin' | 'lawyer'
        const fromCol = activeFrom ?? findColForId(id);

        if (!toCol || !fromCol || toCol === fromCol) return handleDragCancel();

        if (!canDrag) {
            toast.error("You do not have permission to change roles.");
            return handleDragCancel();
        }

        const fromList = Array.from(board[fromCol] || []);
        const toList = Array.from(board[toCol] || []);
        const idx = fromList.findIndex((u) => uidOf(u) === id);
        if (idx < 0) return handleDragCancel();

        const [moved] = fromList.splice(idx, 1);
        const prev = board;
        const next = { ...board, [fromCol]: fromList, [toCol]: [...toList, moved] };
        setBoard(next);
        try {
            await persistRole(id, toCol);
            toast.success(`${nameOf(moved)} is now ${toCol}.`);
            onAfterChange?.();
        } catch (e) {
            setBoard(prev);
            toast.error(e.message || "Failed to update role");
        } finally {
            setActiveFrom(null);
        }
    };

    const activeUser = useMemo(() => (activeId ? getUserById(activeId) : null), [activeId, board]);

    return (
        <div className="mt-6 space-y-2">
            {!canDrag && (
                <p className="text-xs text-amber-600">
                    Only Admin can drag. If no Admin exists, a Lawyer may assign the first Admin.
                </p>
            )}

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DroppableColumn id="admin" title="Admin" count={board.admin?.length || 0}>
                        {(board.admin || []).map((u) => (
                            <DraggableUser key={`admin-${uidOf(u)}`} user={u} disabled={!canDrag} fromColumn="admin" />
                        ))}
                        {(board.admin || []).length === 0 && (
                            <div className="py-6 text-center text-xs text-gray-400">Drop here</div>
                        )}
                    </DroppableColumn>

                    <DroppableColumn id="lawyer" title="Lawyer" count={board.lawyer?.length || 0}>
                        {(board.lawyer || []).map((u) => (
                            <DraggableUser key={`lawyer-${uidOf(u)}`} user={u} disabled={!canDrag} fromColumn="lawyer" />
                        ))}
                        {(board.lawyer || []).length === 0 && (
                            <div className="py-6 text-center text-xs text-gray-400">Drop here</div>
                        )}
                    </DroppableColumn>
                </div>

                <DragOverlay>
                    {activeUser ? (
                        <div className="rounded-lg border px-3 py-2 text-sm shadow-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                            <div className="font-medium">{nameOf(activeUser)}</div>
                            <div className="text-xs text-gray-500">{activeUser?.user_role || "—"}</div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
