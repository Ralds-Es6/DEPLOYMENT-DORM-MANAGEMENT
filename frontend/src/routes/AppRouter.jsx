import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrivateRoute from "./PrivateRoute";

// Admin Pages
import Dashboard from "../pages/Dashboard";
import RoomList from "../pages/RoomList";
import CheckInHistory from "../pages/CheckInHistory";
import AdminRegistration from "../pages/AdminRegistration";
import PendingCheckins from "../pages/PendingCheckins";
import UserManagement from "../pages/UserManagement";
import ReportManagement from "../pages/ReportManagement";
import PrintReport from "../pages/PrintReport";
import AdminSettings from "../pages/AdminSettings";
import AdminPayments from "../pages/AdminPayments";
import AdminChat from "../pages/AdminChat";

// User Pages
import UserDashboard from "../pages/UserDashboard";
import UserRoomList from "../pages/UserRoomList";
import UserProfile from "../pages/UserProfile";
import SubmitReport from "../pages/SubmitReport";

// Auth Pages
import AdminLogin from "../pages/AdminLogin";
import UserLanding from "../pages/UserLanding";
import Register from "../pages/Register";
import BrowseRooms from "../pages/BrowseRooms";

const AppRouter = () => {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  return (
    <Routes>
      {/* Public routes */}
      {/* User Landing Page (Home) */}
      <Route
        path="/"
        element={!user || !user.isAdmin ? <UserLanding /> : <Navigate to="/dashboard" />}
      />
      {/* Admin Login */}
      <Route
        path="/admin/login"
        element={!user || !user.isAdmin ? <AdminLogin /> : <Navigate to="/dashboard" />}
      />
      {/* User Registration */}
      <Route
        path="/register"
        element={!user || user.isAdmin ? <Register /> : <Navigate to="/dashboard" />}
      />
      {/* Admin Setup */}
      <Route
        path="/admin-setup"
        element={!user ? <AdminRegistration /> : <Navigate to="/dashboard" />}
      />
      {/* Browse Rooms - Public page */}
      <Route
        path="/browse-rooms"
        element={<BrowseRooms />}
      />

      {/* Private routes */}
      <Route path="/" element={<PrivateRoute />}>
        {/* Dashboard route - conditionally render admin or user dashboard */}
        <Route
          path="dashboard"
          element={isAdmin ? <Dashboard /> : <UserDashboard />}
        />

        {/* Admin-only routes */}
        {isAdmin && (
          <>
            <Route path="rooms/manage" element={<RoomList />} />
            <Route path="checkin-history" element={<CheckInHistory />} />
            <Route path="pending-checkins" element={<PendingCheckins />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="report-management" element={<ReportManagement />} />
            <Route path="print-report" element={<PrintReport />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="messages" element={<AdminChat />} />
            <Route path="settings" element={<AdminSettings />} />
          </>
        )}

        {/* User routes */}
        {!isAdmin && (
          <>
            <Route path="rooms" element={<UserRoomList />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="submit-report" element={<SubmitReport />} />
          </>
        )}

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
