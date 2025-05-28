import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUser from './pages/USER/ManageUser';
import UserDetail from './pages/USER/UserDetail';
import ManageAssets from './pages/ASSETS/ManageAssets';
import AssetDetail from './pages/ASSETS/AssetDetail';
import HistoryOne from './pages/HISTORY/historyone';
import HistoryDetail from './pages/HISTORY/HistoryDetail';
import Create_ADUser from './pages/SCRIPT/Create_ADUser_DHCP';
import SetLogOn from './pages/SCRIPT/SetLogOn';
import DeleteUser from './pages/SCRIPT/DeleteUser';
import ManageRepairs from './pages/ManageRepairs';
import DeleteDHCP from './pages/SCRIPT/DELETE_DHCP';
import ConsolidatedScripts from './pages/SCRIPT/ConsolidatedScripts';

// Import IP Management pages
import NetworkSegmentPage from './pages/IP_magement/NetworkSegmentPage';
import ExportIPPage from './pages/IP_magement/ExportIPPage';
import IPHistoryPage from './pages/IP_magement/IPHistoryPage';
import IPDivisionTable from './pages/IP_magement/IPDivisionTable';

// Protected route wrapper - yêu cầu đăng nhập
const PrivateRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

// Admin route wrapper - yêu cầu quyền admin
const AdminRoute = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" />;
};

// Public route wrapper - chuyển hướng nếu đã đăng nhập
const PublicRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return !isLoggedIn ? <Outlet /> : <Navigate to="/" />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />} />

        {/* IP Management routes */}
        <Route path="/network-segment" element={<NetworkSegmentPage />} />
        <Route path="/ip-division" element={<IPDivisionTable />} />
        <Route path="/export-ip" element={<ExportIPPage />} />
        <Route path="/ip-history" element={<IPHistoryPage />} />

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/manage-user" element={<ManageUser />} />
          <Route path="/user-detail/:empCode" element={<UserDetail />} />
          <Route path="/manage-assets" element={<ManageAssets />} />
          <Route path="/asset-detail/:assetCode" element={<AssetDetail />} />
          <Route path="/manage-repairs" element={<ManageRepairs />} />
          <Route path="/history-status" element={<HistoryOne />} />
          <Route path="/history/:historyId" element={<HistoryDetail />} />
          <Route path="/script/create-aduser" element={<Create_ADUser />} />
          <Route path="/script/set-logon" element={<SetLogOn />} />
          <Route path="/script/delete-user" element={<DeleteUser />} />
          <Route path="/script/delete-dhcp" element={<DeleteDHCP />} />
          <Route path="/script/consolidated" element={<ConsolidatedScripts />} />
        </Route>
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 