import React, { useState, useEffect } from "react";
import { COLUMNS } from "@/constants";
import Column from "@/components/tasking/column";
import { DndContext } from "@dnd-kit/core";
import toast from "react-hot-toast";

export const Tasking = () => {
    const [tasks, setTasks] = useState([]);

    // Fetch tasks 
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/documents", {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) throw new Error("Failed to fetch tasks");

                const data = await res.json();
                const taskData = data.filter((doc) => doc.doc_type === "Task");
                setTasks(taskData);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();
    }, []);


    // Handle drag end event to update task status
    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        const toastId = toast.loading("Updating task status...", { duration: 4000 });

        try {
            const updatedTasks = tasks.map((task) => {
                if (task.doc_id === taskId && task.doc_status !== newStatus) {
                    fetch(`http://localhost:3000/api/documents/${taskId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ doc_status: newStatus }),
                    })
                        .then((res) => {
                            if (!res.ok) throw new Error("Failed to update task status");
                            toast.success("Task status updated successfully!", { id: toastId });
                        })
                        .catch((error) => {
                            console.error("Error updating task status:", error);
                            toast.error("Failed to update task status", { id: toastId });
                        });

                    return { ...task, doc_status: newStatus };
                }
                return task;
            });
            setTasks(updatedTasks);
        } catch (error) {
            console.error("Error updating task status:", error);
            toast.error("Failed to update task status", { id: toastId });
        }
    }

    // Priority color helper
    const getPriorityStyle = (priority) => {
        switch (priority) {
            case "High":
                return "bg-red-500 text-white";
            case "Medium":
                return "bg-yellow-500 text-white";
            case "Low":
                return "bg-blue-500 text-white";
            default:
                return "bg-gray-400 text-white";
        }
    };

    // Map action buttons to backend status IDs derived from columns (fallbacks included)
    const STATUS_IDS = useState(() => {
        const ids = (Array.isArray(COLUMNS) ? COLUMNS : []).map((c) => c?.id);
        return {
            TODO: ids[0] || "todo",
            INPROGRESS: ids[1] || "in-progress",
            DONE: ids[2] || "done",
        };
    })[0];

    // Update a task's status via backend and sync local state
    const updateTaskStatus = async (taskId, newStatus) => {
        const current = tasks.find((t) => t.doc_id === taskId);
        if (!current || current.doc_status === newStatus) return;

        const toastId = toast.loading("Updating task status...", { duration: 4000 });
        try {
            const res = await fetch(`http://localhost:3000/api/documents/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ doc_status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update task status");

            setTasks((prev) => prev.map((t) => (t.doc_id === taskId ? { ...t, doc_status: newStatus } : t)));
            toast.success("Task status updated successfully!", { id: toastId });
        } catch (err) {
            console.error("Error updating task status:", err);
            toast.error("Failed to update task status", { id: toastId });
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tasks</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Monitor and update tasks with our intuitive drag-and-drop interface.
                </p>
            </div>

            {/* Priority Legend */}
            <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Priority Levels:
                </h3>
                <div className="flex gap-4">
                    {[
                        { color: "bg-red-500", label: "High" },
                        { color: "bg-yellow-500", label: "Medium" },
                        { color: "bg-blue-500", label: "Low" },
                    ].map((p) => (
                        <div key={p.label} className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full ${p.color}`}></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {p.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drag and Drop Columns */}
            <DndContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {COLUMNS.map((column) => (
                        <Column
                            key={column.id}
                            column={column}
                            tasks={tasks.filter((task) => task.doc_status === column.id)}
                            getPriorityStyle={getPriorityStyle}
                        />
                    ))}
                </div>
            </DndContext>

            {/* Table Section */}
            <div className="mt-10">
                <h1 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                    Task Overview
                </h1>

                <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {/* Make table vertically scrollable with sticky header */}
                    <div className="max-h-[70vh] overflow-y-auto">
                        <table className="min-w-[920px] w-full table-fixed text-sm">
                            <thead className="sticky top-0 z-20 bg-gray-100 dark:bg-slate-900/40">
                                <tr>
                                    <th
                                        scope="col"
                                        className="w-[28%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                                    >
                                        Task Name
                                    </th>
                                    <th
                                        scope="col"
                                        className="w-[42%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                                    >
                                        Description
                                    </th>
                                    <th
                                        scope="col"
                                        className="w-[18%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                                    >
                                        Due Date
                                    </th>
                                    <th
                                        scope="col"
                                        className="w-[12%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {tasks.length > 0 ? (
                                    tasks.map((task) => (
                                        <tr
                                            key={task.doc_id}
                                            className="odd:bg-white even:bg-gray-50/60 transition-colors hover:bg-gray-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60 dark:hover:bg-slate-700/60"
                                        >
                                            {/* Task Name */}
                                            <td className="px-5 py-3 align-middle">
                                                <span
                                                    className="block truncate font-medium text-slate-800 dark:text-slate-100"
                                                    title={task.doc_name}
                                                >
                                                    {task.doc_name}
                                                </span>
                                            </td>

                                            {/* Description */}
                                            <td className="px-5 py-3 align-middle">
                                                <p
                                                    className="truncate text-slate-600 dark:text-slate-300"
                                                    title={task.doc_description || ""}
                                                >
                                                    {task.doc_description || "—"}
                                                </p>
                                            </td>

                                            {/* Due Date + Priority */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 justify-start">
                                                    {/* Colored Circle based on Priority */}
                                                    <span className="text-slate-700 dark:text-slate-200">
                                                        {task.doc_due_date
                                                            ? new Date(task.doc_due_date).toLocaleDateString()
                                                            : "No date"}
                                                    </span>
                                                    <span
                                                        className={`inline-block h-2.5 w-2.5 rounded-full ${task.doc_prio_level === "High"
                                                            ? "bg-red-500"
                                                            : task.doc_prio_level === "Medium"
                                                                ? "bg-yellow-500"
                                                                : task.doc_prio_level === "Low"
                                                                    ? "bg-blue-500"
                                                                    : "bg-yellow-500"
                                                            }`}
                                                    ></span>
                                                </div>
                                            </td>


                                            {/* Actions */}
                                            <td className="px-10 py-2 align-middle text-right">
                                                <div className="flex justify-end gap-2 whitespace-nowrap">
                                                    <button
                                                        onClick={() => updateTaskStatus(task.doc_id, STATUS_IDS.TODO)}
                                                        disabled={task.doc_status === STATUS_IDS.TODO}
                                                        className={`rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 ${task.doc_status === STATUS_IDS.TODO
                                                            ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-700/30 dark:text-slate-500"
                                                            : "bg-white text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
                                                            }`}
                                                    >
                                                        To Do
                                                    </button>
                                                    <button
                                                        onClick={() => updateTaskStatus(task.doc_id, STATUS_IDS.INPROGRESS)}
                                                        disabled={task.doc_status === STATUS_IDS.INPROGRESS}
                                                        className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${task.doc_status === STATUS_IDS.INPROGRESS
                                                            ? "cursor-not-allowed bg-indigo-400"
                                                            : "bg-indigo-600 hover:bg-indigo-700"
                                                            }`}
                                                    >
                                                        Progress
                                                    </button>
                                                    <button
                                                        onClick={() => updateTaskStatus(task.doc_id, STATUS_IDS.DONE)}
                                                        disabled={task.doc_status === STATUS_IDS.DONE}
                                                        className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${task.doc_status === STATUS_IDS.DONE
                                                            ? "cursor-not-allowed bg-emerald-400"
                                                            : "bg-emerald-600 hover:bg-emerald-700"
                                                            }`}
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No tasks found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tasking;
