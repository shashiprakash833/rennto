import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Owners from "./pages/Owners";
import Properties from "./pages/Properties";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import { NotificationProvider } from "./context/NotificationContext";

import "./App.css";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem("token")
    );

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const AuthenticatedLayout = ({ children }) => (
        <NotificationProvider>{children}</NotificationProvider>
    );

    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route
                    path="/login"
                    element={
                        !isAuthenticated ? (
                            <Login onLogin={handleLogin} />
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Dashboard />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/owners"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Owners />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/properties"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Properties />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/bookings"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Bookings />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/payments"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Payments />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/complaints"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Complaints />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/reports"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Reports />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route
                    path="/settings"
                    element={
                        isAuthenticated ? (
                            <AuthenticatedLayout>
                                <Settings />
                            </AuthenticatedLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
