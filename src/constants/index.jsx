import { ChartColumn, Folders, Home, ListTodo, Users, Logs, Archive, ShieldUser, FileText, Wallet } from "lucide-react";

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
    { label: "Activity Logs", icon: Logs, path: "/user-logs" },
];

// Export a function to get filtered links based on role
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

export const overviewData = [
    {
        name: "Criminal",
        total: 150,
    },
    {
        name: "Civil",
        total: 700,
    },
    {
        name: "Special Proceedings",
        total: 100,
    },
    {
        name: "Constitutional",
        total: 200,
    },
    {
        name: "Jurisdictional",
        total: 20,
    },
    {
        name: "Special Courts",
        total: 20,
    },
];

// Task Management Columns or Statuses
export const COLUMNS = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
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

// Case stages (display-only for now)
// key: unique id, label: shown in UI, order: progression order, color: tailwind bg class for pill/dot
export const CASE_STAGES = [
    { key: "intake", label: "Intake", order: 10, color: "bg-slate-500" },
    { key: "prepare_complaint", label: "Prepare Complaint", order: 20, color: "bg-indigo-600" },
    { key: "file_complaint", label: "File Complaint", order: 30, color: "bg-blue-600" },
    { key: "serve_summons", label: "Serve Summons", order: 40, color: "bg-cyan-600" },
    { key: "await_answer", label: "Await Answer", order: 50, color: "bg-amber-600" },
    { key: "discovery", label: "Discovery", order: 60, color: "bg-yellow-600" },
    { key: "pre_trial", label: "Pre-trial", order: 70, color: "bg-purple-600" },
    { key: "trial", label: "Trial", order: 80, color: "bg-red-600" },
    { key: "judgment", label: "Judgment", order: 90, color: "bg-emerald-600" },
    { key: "enforcement", label: "Enforcement", order: 100, color: "bg-green-700" },
    { key: "closed", label: "Closed", order: 110, color: "bg-gray-800" },
];

export const getCaseStageMeta = (key) => {
    if (!key) return null;
    return CASE_STAGES.find((s) => s.key === key) || null;
};