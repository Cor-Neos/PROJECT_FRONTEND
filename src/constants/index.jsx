import { ChartColumn, Folders, Home, ListTodo, Users, Logs, Archive, ShieldUser, FileText, Wallet, Trash } from "lucide-react";

const allNavbarLinks = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Cases", icon: Folders, path: "/cases" },
    { label: "Documents", icon: FileText, path: "/documents" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Tasks", icon: ListTodo, path: "/tasks" },
    { label: "Users", icon: ShieldUser, path: "/users" },
    { label: "Reports", icon: ChartColumn, path: "/reports" },
    { label: "Case Archive", icon: Archive, path: "/case-archive" },
    { label: "Payments", icon: Wallet, path: "/payments" },
    { label: "Trash", icon: Trash, path: "/trash" },
    { label: "Activity Logs", icon: Logs, path: "/user-logs" },
];

// 🔧 Export a function to get filtered links based on role
export const getNavbarLinks = (role) => {
    if (role === "Admin") {
        return allNavbarLinks;
    }

    if (role === "Lawyer") {
        return allNavbarLinks.filter((link) => link.label !== "Users" && link.label !== "Reports");
    }

    if (role === "Staff") {
        return allNavbarLinks.filter((link) => ["Home", "Documents", "Clients", "Tasks", "Activity Logs"].includes(link.label));
    }

    if (role === "Paralegal") {
        return allNavbarLinks.filter((link) => ["Home", "Documents", "Tasks", "Activity Logs"].includes(link.label));
    }

    return [];
};

// Task Management Columns or Statuses
export const COLUMNS = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done (For Approval)" },
];

export const INITIAL_TASKS = [
    {
        id: "1",
        title: "Research Project",
        description: "Gather requirements and create initial documentation",
        status: "todo",
        priolevel: "high",
    },
    {
        id: "2",
        title: "Design System",
        description: "Create component library and design tokens",
        status: "todo",
        priolevel: "medium",
    },
    {
        id: "3",
        title: "API Integration",
        description: "Implement REST API endpoints",
        status: "todo",
        priolevel: "low",
    },
    {
        id: "4",
        title: "Testing",
        description: "Write unit tests for core functionality",
        status: "todo",
        priolevel: "medium",
    },
];
