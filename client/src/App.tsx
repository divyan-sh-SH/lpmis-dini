import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import CartsPage from './pages/CartsPage';
import ExpensePage from './pages/ExpensePage';
import HomePage from './pages/HomePage';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <NavBar />
      <div className="app-body">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/expense" element={<ExpensePage />} />
          <Route path="/carts" element={<CartsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
