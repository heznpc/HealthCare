import { Outlet, Navigate, Route, Routes } from 'react-router-dom';
import { usePrivateAuth } from '../auth/usePrivateAuth';
import ProfileEdit from '../views/ProfileEdit';
import DeleteAccount from '../views/DeleteAccount';

const PrivateRoutes = () => {
  const { isAuthorized, isLoading } = usePrivateAuth();

  if (isLoading) return <div>로딩 중...</div>;
  if (!isAuthorized) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route path="/" element={<Outlet />}>
        <Route path="edit-profile" element={<ProfileEdit />} />
        <Route path="delete-account" element={<DeleteAccount />} />
      </Route>
    </Routes>
  );
};

export default PrivateRoutes;
