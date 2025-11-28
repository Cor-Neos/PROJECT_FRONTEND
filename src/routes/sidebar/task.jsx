import React, { useState, useEffect, use } from "react";
import { COLUMNS } from "@/constants";
import Column from "@/components/tasking/column";
import { DndContext } from "@dnd-kit/core";
import toast from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import api from "@/utils/api";
import { useNavigate } from "react-router-dom";

export const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);

    // Fetch tasks
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const path = user.user_role === "Admin" ? "/documents" : `/documents/task/user/${user.user_id}`;
                const data = await api.get(path);
                const taskData = data.filter((doc) => doc.doc_type === "Task");
                setTasks(taskData);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };
        fetchTasks();
    }, [user.user_role, user.user_id]);

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
                    api
                        .put(`/documents/${taskId}`, { doc_status: newStatus, doc_last_updated_by: user.user_id })
                        .then(() => {
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
            INPROGRESS: ids[1] || "in_progress",
            DONE: ids[2] || "done",
            APPROVED: "approved",
        };
    })[0];

    // Update a task's status via backend and sync local state
    const updateTaskStatus = async (taskId, newStatus) => {
        const current = tasks.find((t) => t.doc_id === taskId);
        if (!current || current.doc_status === newStatus) return;

        const toastId = toast.loading("Updating task status...", { duration: 4000 });
        try {
            await api.put(`/documents/${taskId}`, { doc_status: newStatus, doc_last_updated_by: user.user_id });
            setTasks((prev) => prev.map((t) => (t.doc_id === taskId ? { ...t, doc_status: newStatus } : t)));
            toast.success("Task status updated successfully!", { id: toastId });
        } catch (err) {
            console.error("Error updating task status:", err);
            toast.error("Failed to update task status", { id: toastId });
        }
    };

    const [users, setUsers] = useState([]);

    // fetch users for name resolution
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.get("/users");
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    // get userfull name helper
    const getUserFullName = (userId) => {
        if (!Array.isArray(users)) return "Unknown";
        const user = users.find((u) => u.user_id === userId);
        return user ? `${user.user_fname} ${user.user_mname ? user.user_mname[0] + "." : ""} ${user.user_lname}` : "Unknown";
    };

    // for task modal
    const [fileReferences, setFileReferences] = useState([]);

    useEffect(() => {
        if (!selectedTask) return;

        let refs = [];
        try {
            if (typeof selectedTask.doc_reference === "string") {
                const parsed = JSON.parse(selectedTask.doc_reference);
                if (Array.isArray(parsed)) refs = parsed;
            } else if (Array.isArray(selectedTask.doc_reference)) {
                refs = selectedTask.doc_reference;
            }
        } catch (e) {
            console.error("Failed to parse doc_reference", e);
        }

        setFileReferences(refs);
    }, [selectedTask]);

    // Function for Staff and Paralegal to update a "todo" selectedTask when viewed from todo to in_progress
    useEffect(() => {
        if (!selectedTask) return;
        if (selectedTask.doc_status !== STATUS_IDS.TODO) return;
        if (user.user_role === "Admin" || user.user_role === "Lawyer") return;

        updateTaskStatus(selectedTask.doc_id, STATUS_IDS.INPROGRESS);
    }, [selectedTask]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tasks</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and update tasks with our intuitive drag-and-drop interface.</p>
            </div>

            {/* Priority Legend */}
            <div className="flex items-center gap-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority Levels:</h3>
                <div className="flex gap-4">
                    {[
                        { color: "bg-red-500", label: "High" },
                        { color: "bg-yellow-500", label: "Mid" },
                        { color: "bg-blue-500", label: "Low" },
                    ].map((p) => (
                        <div
                            key={p.label}
                            className="flex items-center gap-2"
                        >
                            <div className={`h-4 w-4 rounded-full ${p.color}`}></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{p.label}</span>
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
                            onTaskClick={(task) => setSelectedTask(task)}
                        />
                    ))}
                </div>
            </DndContext>

            {/* Overdue Tasks */}
            <div className="mt-10">
                <h1 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">Overdue Tasks</h1>
                <div className="overflow-x-auto rounded-xl bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <div className="max-h-[40vh] overflow-y-auto">
                        <table className="w-full table-auto text-sm">
                            <thead className="bg-gray-100 dark:bg-slate-900/40">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Task Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Due Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Tasked To
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Tasked By
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="dark:divide-slate-700">
                                {tasks.filter(
                                    (task) =>
                                        task.doc_due_date &&
                                        new Date(task.doc_due_date) < new Date() &&
                                        task.doc_status !== STATUS_IDS.DONE &&
                                        task.doc_status !== STATUS_IDS.APPROVED,
                                ).length > 0 ? (
                                    tasks
                                        .filter(
                                            (task) =>
                                                task.doc_due_date &&
                                                new Date(task.doc_due_date) < new Date() &&
                                                task.doc_status !== STATUS_IDS.DONE &&
                                                task.doc_status !== STATUS_IDS.APPROVED,
                                        )
                                        .map((task) => (
                                            <tr
                                                key={task.doc_id}
                                                className="transition-colors odd:bg-white even:bg-gray-50/60 hover:bg-gray-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60 dark:hover:bg-slate-700/60"
                                            >
                                                <td className="max-w-[180px] truncate px-4 font-medium text-slate-800 dark:text-slate-100">
                                                    {task.doc_name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                                    {new Date(task.doc_due_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 capitalize text-slate-800 dark:text-slate-100">
                                                    {task.doc_status === "todo"
                                                        ? "To Do"
                                                        : task.doc_status === "in_progress"
                                                          ? "In Progress"
                                                          : task.doc_status === "done"
                                                            ? "Done"
                                                            : task.doc_status}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                                    {getUserFullName(task.doc_tasked_to) || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                                    Atty. {getUserFullName(task.doc_tasked_by) || "-"}
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No overdue tasks.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Task Overview */}
            <div className="mt-10">
                <h1 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">Task Overview</h1>

                <div className="overflow-x-auto rounded-xl bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    <div className="max-h-[70vh] overflow-y-auto">
                        <table className="w-full table-auto text-sm">
                            <thead className="bg-gray-100 dark:bg-slate-900/40">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Task Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Due Date
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="dark:divide-slate-700">
                                {tasks.length > 0 ? (
                                    tasks.map((task) => (
                                        <tr
                                            key={task.doc_id}
                                            className="transition-colors odd:bg-white even:bg-gray-50/60 hover:bg-gray-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60 dark:hover:bg-slate-700/60"
                                        >
                                            {/* Task Name */}
                                            <td className="max-w-[180px] truncate px-4 font-medium text-slate-800 dark:text-slate-100">
                                                {task.doc_name}
                                            </td>

                                            {/* Description */}
                                            <td className="px-4 py-3 leading-relaxed text-slate-600 dark:text-slate-300">
                                                <div className="line-clamp-3 break-words">{task.doc_task || task.doc_description || "—"}</div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3 capitalize text-slate-800 dark:text-slate-100">
                                                {task.doc_status === "todo"
                                                    ? "To Do"
                                                    : task.doc_status === "in_progress"
                                                      ? "In Progress"
                                                      : task.doc_status === "done"
                                                        ? "Done"
                                                        : task.doc_status}
                                            </td>

                                            {/* Due Date + Priority */}
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-700 dark:text-slate-200">
                                                        {task.doc_due_date ? new Date(task.doc_due_date).toLocaleDateString() : "No date"}
                                                    </span>
                                                    <span
                                                        title={`Priority: ${task.doc_prio_level || "None"}`}
                                                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                                                            task.doc_prio_level === "High"
                                                                ? "bg-red-500"
                                                                : task.doc_prio_level === "Mid"
                                                                  ? "bg-yellow-500"
                                                                  : task.doc_prio_level === "Low"
                                                                    ? "bg-blue-500"
                                                                    : "bg-gray-400"
                                                        }`}
                                                    ></span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            {task.doc_status !== "approved" ? (
                                                <td className="px-4 py-2 text-center">
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        <button
                                                            onClick={() => updateTaskStatus(task.doc_id, STATUS_IDS.TODO)}
                                                            disabled={task.doc_status === STATUS_IDS.TODO}
                                                            className={`rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 ${
                                                                task.doc_status === STATUS_IDS.TODO
                                                                    ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-700/30 dark:text-slate-500"
                                                                    : "bg-white text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
                                                            }`}
                                                        >
                                                            To Do
                                                        </button>
                                                        <button
                                                            onClick={() => updateTaskStatus(task.doc_id, STATUS_IDS.INPROGRESS)}
                                                            disabled={task.doc_status === STATUS_IDS.INPROGRESS}
                                                            className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                                                                task.doc_status === STATUS_IDS.INPROGRESS
                                                                    ? "cursor-not-allowed bg-indigo-400"
                                                                    : "bg-indigo-600 hover:bg-indigo-700"
                                                            }`}
                                                        >
                                                            Progress
                                                        </button>
                                                        <button
                                                            onClick={() => updateTaskStatus(task.doc_id, STATUS_IDS.DONE)}
                                                            disabled={task.doc_status === STATUS_IDS.DONE}
                                                            className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                                                                task.doc_status === STATUS_IDS.DONE
                                                                    ? "cursor-not-allowed bg-emerald-400"
                                                                    : "bg-emerald-600 hover:bg-emerald-700"
                                                            }`}
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : (
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => navigate("/tasks/approved")}
                                                        className="rounded-md border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-600 hover:text-white dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-700 dark:hover:text-white"
                                                    >
                                                        View Approved Tasks
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
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

            {/* Task Details Modal */}
            {selectedTask && (
                <div className="animate-fadeIn fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out">
                    <div className="w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all duration-200 ease-out dark:bg-slate-800">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTask.doc_name}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Task ID: {selectedTask.doc_id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="max-h-[80vh] overflow-y-auto p-6 text-sm">
                            {/* Meta Info */}
                            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Priority</p>
                                    <p
                                        className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                                            selectedTask.doc_prio_level === "High"
                                                ? "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300"
                                                : selectedTask.doc_prio_level === "Mid"
                                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300"
                                                  : "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300"
                                        }`}
                                    >
                                        {selectedTask.doc_prio_level || "None"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Status</p>
                                    <p className="mt-0.5 font-medium capitalize text-slate-800 dark:text-slate-200">
                                        {selectedTask.doc_status === "todo"
                                            ? "to do"
                                            : selectedTask.doc_status === "in_progress"
                                              ? "in progress"
                                              : "done" || "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Due Date</p>
                                    <p className="mt-0.5 text-slate-800 dark:text-slate-200">
                                        {selectedTask.doc_due_date ? new Date(selectedTask.doc_due_date).toLocaleDateString() : "No due date"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Tasked By</p>
                                    <p className="mt-0.5 text-slate-800 dark:text-slate-200">
                                        {getUserFullName(selectedTask.doc_tasked_by)
                                            ? `Atty. ${getUserFullName(selectedTask.doc_tasked_by)}`
                                            : "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Related Case</p>
                                    <p className="mt-0.5 text-slate-800 dark:text-slate-200">
                                        {selectedTask.case_id ? `Case #${selectedTask.case_id}` : "No case linked"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Tasked To</p>
                                    <p className="mt-0.5 text-slate-800 dark:text-slate-200">
                                        {getUserFullName(selectedTask.doc_tasked_to) || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            {/* Task Details */}
                            <div className="mb-6">
                                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Task Details:</h3>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    {selectedTask.doc_task || "No task details available."}
                                </p>
                            </div>

                            {/* File References */}
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">File References:</h3>
                                {fileReferences.length > 0 ? (
                                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                                        {fileReferences.map((ref, index) => (
                                            <li key={index}>
                                                <a
                                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                                    href={`${api.baseUrl.replace(/\/api$/, '')}${ref}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    📄 {ref.split("/").pop()}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs italic text-slate-500 dark:text-slate-400">No file references found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
