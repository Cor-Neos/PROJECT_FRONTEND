import React, { use } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context.jsx";

const ApprovedTasks = () => {
    const { user } = useAuth();

    const [approvedTasks, setApprovedTasks] = useState([]);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // Fetch approved tasks for the user
        const fetchApprovedTasks = async () => {
            try {
                const task_endpoint =
                    user.user_role === "Admin"
                        ? "http://localhost:3000/api/documents"
                        : `http://localhost:3000/api/documents/task/user/${user.user_id}`;

                const response = await fetch(task_endpoint, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                // Filter tasks with doc_status "approved"
                const data = await response.json();
                const approvedTasks = data.filter((task) => task.doc_status === "approved");
                setApprovedTasks(approvedTasks);
            } catch (error) {
                console.error("Error fetching approved tasks:", error);
                setError("Failed to fetch approved tasks.");
            }
        };

        fetchApprovedTasks();
    }, [user]);

    // fetch users to get full name of tasked to
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/users", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : data.users || []);
            } catch (error) {
                console.error("Error fetching users:", error);
                setError("Failed to fetch users.");
            }
        };

        fetchUsers();
    }, []);

    // get full name by user id
    const getUserFullName = (assignedById) => {
        if (!Array.isArray(users)) return "Unknown";
        const user = users.find((u) => u.user_id === assignedById);
        return user ? `${user.user_fname} ${user.user_mname ? user.user_mname[0] + "." : ""} ${user.user_lname}` : "Unknown";
    };

    return (
        <div className="p-4">
            <h2 className="title">Approved Tasks</h2>
            {error && <p className="mt-5 text-red-500">{error}</p>}

            {approvedTasks.length === 0 ? (
                <p>No approved tasks available.</p>
            ) : (
                <table className="mt-5 min-w-full rounded-lg bg-white text-left text-sm shadow-md dark:bg-gray-800 dark:text-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">Task ID</th>
                            <th className="px-4 py-2">Document Name</th>
                            <th className="px-4 py-2">Tasked To</th>
                            <th className="px-4 py-2">Tasked By</th>
                            <th className="px-4 py-2">Due Date</th>
                            <th className="px-4 py-2">Date Submitted</th>
                            <th className="px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedTasks.map((task) => (
                            <tr
                                key={task.doc_id}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <td className="px-4 py-2">{task.doc_id}</td>
                                <td className="px-4 py-2">{task.doc_name}</td>
                                <td className="px-4 py-2">{getUserFullName(task.doc_tasked_to)}</td>
                                <td className="px-4 py-2">Atty. {getUserFullName(task.doc_tasked_by)}</td>
                                <td className="px-4 py-2">{new Date(task.doc_due_date).toLocaleDateString()}</td>
                                <td className="px-4 py-2">
                                    {new Date(task.doc_date_submitted).toLocaleDateString()}
                                    {task.doc_due_date < task.doc_date_submitted && (
                                        <span className="ml-2 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">Late</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">{task.doc_status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ApprovedTasks;