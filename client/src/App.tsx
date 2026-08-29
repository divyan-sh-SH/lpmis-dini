import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PersonalPage from './pages/PersonalPage';
import PersonalNotesPage from './pages/PersonalNotesPage';
import PersonalHabitsPage from './pages/PersonalHabitsPage';
import HabitConfigPage from './pages/HabitConfigPage';
import PersonalCalendarPage from './pages/PersonalCalendarPage';
import PersonalTodosPage from './pages/PersonalTodosPage';
import GroupsPage from './pages/GroupsPage';
import GroupPage from './pages/GroupPage';
import GroupNotesPage from './pages/GroupNotesPage';
import GroupHabitsPage from './pages/GroupHabitsPage';
import GroupCalendarPage from './pages/GroupCalendarPage';
import GroupTodosPage from './pages/GroupTodosPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pb-12 pt-5">
        {user ? (
          // --- AUTHENTICATED STATE: Show the main app ---
          <div className="flex flex-1 flex-col">
            <NavBar />
            <div className="pt-5 flex flex-col flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/personal" element={<PersonalPage />} />
                <Route path="/personal/notes" element={<PersonalNotesPage />} />
                <Route path="/personal/habits" element={<PersonalHabitsPage />} />
                <Route path="/personal/habits/config" element={<HabitConfigPage scope="personal" />} />
                <Route path="/personal/calendar" element={<PersonalCalendarPage />} />
                <Route path="/personal/todos" element={<PersonalTodosPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:groupId" element={<GroupPage />} />
                <Route path="/groups/:groupId/notes" element={<GroupNotesPage />} />
                <Route path="/groups/:groupId/habits" element={<GroupHabitsPage />} />
                <Route path="/groups/:groupId/habits/config" element={<HabitConfigPage scope="group" />} />
                <Route path="/groups/:groupId/calendar" element={<GroupCalendarPage />} />
                <Route path="/groups/:groupId/todos" element={<GroupTodosPage />} />
                <Route path="/chat" element={<ChatPage />} />
                {/* Catch-all: If they type a random URL, send them Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        ) : (
          // --- UNAUTHENTICATED STATE: Show the Login Page ---
          <div className="flex flex-1 flex-col pt-5">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              {/* Catch-all: If they try to go anywhere else while logged out, force them to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        )}
      </div>
      <Footer />
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