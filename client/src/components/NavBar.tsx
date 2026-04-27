import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

export default function NavBar() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
    <nav className="sticky top-0 z-10 -mx-5 mb-5 bg-white/85 backdrop-blur-[10px] border-b border-slate-200/90 p-3.5 flex items-center justify-between gap-4">
      <Link to="/" className="no-underline text-inherit" aria-label="Go to HomeDash home">
        <Logo />
      </Link>

      <div className="flex gap-1 items-center">
        <NavLink to="/personal" className={({ isActive }) => `no-underline px-3 py-1.5 rounded-full text-slate-500 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-blue-50 text-blue-500 border-blue-300/35' : ''}`}>
          My Dash
        </NavLink>
        <NavLink to="/groups" className={({ isActive }) => `no-underline px-3 py-1.5 rounded-full text-slate-500 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-blue-50 text-blue-500 border-blue-300/35' : ''}`}>
          My HomeDash
        </NavLink>
      </div>

      <div className="flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-900 hover:text-slate-600 transition"
          >
            <AccountCircleRoundedIcon sx={{ fontSize: 26 }} />
          </button>
          <div
            className={`absolute right-0 top-[110%] bg-white border border-slate-200 rounded-xl p-1 min-w-[180px] shadow-lg ${menuOpen ? 'block' : 'hidden'}`}
          >
            <button type="button" className="w-full border-0 bg-transparent px-2.5 py-2.5 rounded-lg cursor-pointer text-left font-semibold text-slate-900 hover:bg-slate-50">
              Profile Settings
            </button>
            <button
              type="button"
              className="w-full border-0 bg-transparent px-2.5 py-2.5 rounded-lg cursor-pointer text-left font-semibold text-slate-900 hover:bg-slate-50"
              onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    {showLogoutConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex flex-col items-center text-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-400">
              <LogoutRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Log out?</h3>
            <p className="text-sm text-slate-500">Are you sure you want to log out?</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              No, stay
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Yes, logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}