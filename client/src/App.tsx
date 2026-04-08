import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import PersonalPage from './pages/PersonalPage';
import GroupsPage from './pages/GroupsPage';
import GroupPage from './pages/GroupPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-5 pb-12 text-slate-900">
      {user ? (
        // --- AUTHENTICATED STATE: Show the main app ---
        <div>
          <NavBar />
          <div className="pt-5">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/personal" element={<PersonalPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupPage />} />
              {/* Catch-all: If they type a random URL, send them Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      ) : (
        // --- UNAUTHENTICATED STATE: Show the Login Page ---
        <div className="pt-5">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Catch-all: If they try to go anywhere else while logged out, force them to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}