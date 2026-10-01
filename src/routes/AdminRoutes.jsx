// src/routes/AdminRoutes.jsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import ProfileEdit from "../views/ProfileEdit";
import DeleteAccount from "../views/DeleteAccount";
import AdminDashboard from "components/commons/admin/AdminDashboard";
import DietManagement from "components/commons/admin/diet/DietManagement";
import DietAnalysis from "components/commons/admin/diet/DietAnalysis";
import WeightManagement from "components/commons/admin/weight/WeightManagement";
import GuestManagement from "components/commons/admin/guest/GuestManagement";
import ExerciseManager from "components/commons/admin/exercise/ExerciseManager";
import HomeTrainingManager from "components/commons/admin/exercise/HomeTrainingManager";

const AdminRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>로딩 중...</div>;
  // 권한 체크
  if ( user?.role !== "ADMIN" ) {
    return <Navigate to="/notfound" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Outlet />}>
        <Route path="dashboard" element={<AdminDashboard />}/>
        <Route path="diet-manager" element={<DietManagement />}/>
        <Route path="diet-analysis" element={<DietAnalysis />}/>
        <Route path="weight-manager" element={<WeightManagement />}/>
        <Route path="exercise-manager" element={<ExerciseManager />}/>
        <Route path="hometraining-manager" element={<HomeTrainingManager isAdmin={true} />}/>
        <Route path="guest-manager" element={<GuestManagement />}/>
        <Route path="edit-profile" element={<ProfileEdit />} />
        <Route path="delete-account" element={<DeleteAccount />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
