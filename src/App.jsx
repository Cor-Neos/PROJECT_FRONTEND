import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "react-hot-toast";

import Layout from "./routes/layout";
import ProtectedRoute from "./components/protected-route";

import DashboardPage from "./routes/dashboard/page";
import Login from "./auth/login";
import Verify from "./auth/verification"; // 2FA
import ForgotPassword from "./auth/forgotpass";
import Registration from "./components/registration";

// sidebar items
import Cases from "./routes/sidebar/cases";
import Documents from "./routes/sidebar/documents";
import Clients from "./routes/sidebar/clients";
import Tasks from "./routes/sidebar/task";
import Users from "./routes/sidebar/users";
import Reports from "./routes/sidebar/reports";
import UserLogs from "./routes/sidebar/user-logs";
import Archives from "./routes/sidebar/archives";
import Notifications from "./components/notifications";
import NotificationSettings from "./components/notif-settings";
import { UnauthorizedAccess } from "./auth/unauthorized";
import ClientContact from "./components/client-contacts";
import ChangePass from "./auth/changepass";
import { Payments } from "./routes/sidebar/payments";
import Settings from "./components/settings";
import ApprovedTasks from "./components/approved-tasks";
import CaseFolder from "./components/case-folder";
import RecentlyDeleted from "./routes/sidebar/recently-deleted";

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/login",
            element: <Login />,
        },
        {
            path: "/forgot-password",
            element: <ForgotPassword />,
        },
        {
            path: "/verify",
            element: <Verify />,
        },
        {
            path: "/change-password/:token",
            element: <ChangePass />,
        },
        {
            path: "/unauthorized",
            element: <UnauthorizedAccess />,
        },
        {
            element: <ProtectedRoute />,
            children: [
                {
                    path: "/",
                    element: <Layout />,
                    children: [
                        { index: true, element: <DashboardPage /> },
                        { path: "cases", element: <Cases /> },
                        { path: "cases/case-folder", element: <CaseFolder /> },
                        { path: "documents", element: <Documents /> },
                        { path: "clients", element: <Clients /> },
                        { path: "clients/contacts", element: <ClientContact /> },
                        { path: "tasks", element: <Tasks /> },
                        { path: "tasks/approved", element: <ApprovedTasks /> },
                        { path: "users", element: <Users /> },
                        {
                            path: "register",
                            element: <Registration />,
                        },
                        { path: "reports", element: <Reports /> },
                        { path: "user-logs", element: <UserLogs /> },
                        { path: "case-archive", element: <Archives /> },
                        { path: "notifications", element: <Notifications /> },
                        { path: "notifications/notif-settings", element: <NotificationSettings /> },
                        { path: "payments", element: <Payments /> },
                        { path: "trash", element: <RecentlyDeleted/> },
                        { path: "settings", element: <Settings /> },
                    ],
                },
            ],
        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            <AuthProvider>
                <Toaster
                    position="top-center"
                    reverseOrder={false}
                />
                <RouterProvider router={router} />
            </AuthProvider>
        </ThemeProvider>
    );
}
