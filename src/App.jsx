import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "./context/auth-context";
import { Toaster } from "react-hot-toast";

// Pages & Layout
import Layout from "./routes/layout";
import ProtectedRoute from "./components/protected-route";

import DashboardPage from "./routes/dashboard/page";
import Login from "./auth/login";
import ForgotPassword from "./auth/forgotpassword";
import Users from "./routes/sidebar/users";
import Documents from "./routes/sidebar/documents";
import Cases from "./routes/sidebar/cases";
import Archives from "./routes/sidebar/archives";
import Userlogs from "./routes/sidebar/user-logs";
import Reports from "./routes/sidebar/reports";
import Notification from "./components/notification";
import NotificationSettings from "./components/notif-settings";
import Verify from "./auth/verification";
import Register from "./components/registration";
import Clients from "./routes/sidebar/clients";
import Tasks from "./routes/sidebar/task";
import ClientContact from "./components/client-contacts";
import ChangePass from "./auth/changepass";
import Promotion from "./components/promotion";
import { UnauthorizedAccess } from "./auth/unauthorized";
import { Payments } from "./routes/sidebar/payments";
import Settings from "./components/settings";
import ApprovedTasks from "./components/approved-tasks";

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
            path: "unauthorized",
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
                        { path: "documents", element: <Documents /> },
                        { path: "clients", element: <Clients /> },
                        { path: "clients/contacts", element: <ClientContact /> },
                        { path: "tasks", element: <Tasks /> },
                        { path: "tasks/approved", element: <ApprovedTasks /> },
                        { path: "users", element: <Users /> },
                        {
                            path: "register",
                            element: <Register />,
                        },
                        { path: "reports", element: <Reports /> },
                        { path: "user-logs", element: <Userlogs /> },
                        { path: "case-archive", element: <Archives /> },
                        { path: "notifications", element: <Notification /> },
                        { path: "notifications/notif-settings", element: <NotificationSettings /> },
                        { path: "promotion", element: <Promotion /> },
                        { path: "payments", element: <Payments /> },
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
