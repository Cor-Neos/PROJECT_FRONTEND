import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import toast from "react-hot-toast";

const nameOf = (u) => [u?.user_fname, u?.user_mname, u?.user_lname].filter(Boolean).join(" ") || u?.user_email || `User #${u?.user_id ?? "?"}`;

const uidOf = (u) => u?.user_id ?? u?.id;

const DraggableUser = ({ user, from, canDrag }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: uidOf(user),
        disabled: !canDrag,
        data: { from, ...user },
    });

    return (
        <div
            ref={setNodeRef}
            style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
            {...attributes}
            {...listeners}
            className={`mb-2 rounded-md border p-2 text-sm shadow-sm ${
                canDrag ? "cursor-move" : "cursor-not-allowed opacity-70"
            } ${isDragging ? "opacity-50" : "bg-white dark:bg-gray-900"}`}
        >
            <p className="font-medium">{nameOf(user)}</p>
            <p className="text-xs text-gray-500">{user?.user_role}</p>
        </div>
    );
};

const DroppableColumn = ({ id, title, users, canDrag, onEmpty }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div className="flex-1 rounded-lg border p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <span className="text-xs text-gray-500">{users.length}</span>
            </div>
            <div
                ref={setNodeRef}
                className={`min-h-[200px] rounded-md p-2 transition ${isOver ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
            >
                {users.length > 0 ? (
                    users.map((u) => (
                        <DraggableUser
                            key={uidOf(u)}
                            user={u}
                            from={id}
                            canDrag={canDrag}
                        />
                    ))
                ) : (
                    <div className="py-8 text-center text-xs text-gray-400">{onEmpty || "Drop here"}</div>
                )}
            </div>
        </div>
    );
};

export default function CaseAccessBoard({ users = [], apiBase = "", currentUserRole = "", onAfterChange }) {
    const [admins, setAdmins] = useState([]);
    const [lawyers, setLawyers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);

    useEffect(() => {
        setAdmins(users.filter((u) => u.user_role === "Admin"));
        setLawyers(users.filter((u) => u.user_role === "Lawyer"));
    }, [users]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const canDrag = currentUserRole === "Admin" || (!admins.length && currentUserRole === "Lawyer");

    const updateRole = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { user_role: newRole });
            return true;
        } catch (e) {
            console.error(e);
            toast.error(e.message);
            return false;
        }
    };

    const handleDragEnd = async ({ active, over }) => {
        if (!active || !over) return;
        const toastId = toast.loading("Updating role...", { duration: 3000 });

        const from = active.data.current?.from;
        const to = over.id;
        if (from === to) return;

        const draggedUser = from === "Admin" ? admins.find((u) => uidOf(u) === active.id) : lawyers.find((u) => uidOf(u) === active.id);
        if (!draggedUser) return;

        // Prevent removing last admin
        if (from === "Admin" && to === "Lawyer" && admins.length === 1) {
            toast.error("At least one Admin must remain.");
            return;
        }

        const success = await updateRole(uidOf(draggedUser), to);
        if (!success) return;

        // Update UI
        if (from === "Admin") setAdmins(admins.filter((u) => uidOf(u) !== active.id));
        if (from === "Lawyer") setLawyers(lawyers.filter((u) => uidOf(u) !== active.id));

        if (to === "Admin") setAdmins([...admins, { ...draggedUser, user_role: "Admin" }]);
        if (to === "Lawyer") setLawyers([...lawyers, { ...draggedUser, user_role: "Lawyer" }]);

        toast.success(`${nameOf(draggedUser)} is now ${to}.`, { id: toastId });
        onAfterChange?.();
    };

    return (
        <div className="space-y-3">
            {!canDrag && <p className="text-xs text-amber-600">Only Admin can drag. If no Admin exists, a Lawyer may assign the first Admin.</p>}

            <DndContext
                sensors={sensors}
                onDragStart={(e) => setActiveUser(e.active?.data?.current)}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DroppableColumn
                        id="Admin"
                        title="Admins"
                        users={admins}
                        canDrag={canDrag}
                    />
                    <DroppableColumn
                        id="Lawyer"
                        title="Lawyers"
                        users={lawyers}
                        canDrag={canDrag}
                    />
                </div>

                <DragOverlay>
                    {activeUser && (
                        <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                            <p className="font-medium">{nameOf(activeUser)}</p>
                            <p className="text-xs text-gray-500">{activeUser.user_role}</p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
