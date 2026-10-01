// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/commons/layout/Layout";
import PublicRoutes from "./routes/PublicRoutes";
import PrivateRoutes from "./routes/PrivateRoutes";
import NotFoundPage from "./views/NotFoundPage";
import { AuthProvider } from "./auth/useAuth";
import { GoalPromptProvider } from "./features/popup/GoalPromptProvider.jsx";
import GoalPromptGuard from "features/popup/GoalPromptGuard.jsx";
import AdminRoutes from "routes/AdminRoutes";

function App() {
  return (
    <AuthProvider>
      <GoalPromptProvider>
        <Router>
          <GoalPromptGuard exclude={["/","/notfound", "/login", "/signup","/admin/*"]} />
          <Layout>
            <Routes>
              <Route path="/*" element={<PublicRoutes />} />
              <Route path="/user/*" element={<PrivateRoutes />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/notfound" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/notfound" />} />
            </Routes>
          </Layout>
        </Router>
      </GoalPromptProvider>
    </AuthProvider>
  );
}

export default App;
