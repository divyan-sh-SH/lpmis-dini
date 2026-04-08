import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

export default function NavBar() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-10 -mx-5 mb-5 bg-white/85 backdrop-blur-[10px] border-b border-slate-200/90 p-3.5 flex items-center justify-between gap-4">
      <Link to="/" className="no-underline text-inherit" aria-label="Go to HomeDash home">
        <Logo />
      </Link>

      <div className="flex gap-1 items-center">
        <NavLink to="/personal" className={({ isActive }) => `no-underline px-3 py-1.5 rounded-full text-slate-700 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-blue-50 text-blue-700 border-blue-300/35' : ''}`}>
          Me
        </NavLink>
        <NavLink to="/groups" className={({ isActive }) => `no-underline px-3 py-1.5 rounded-full text-slate-700 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-blue-50 text-blue-700 border-blue-300/35' : ''}`}>
          My Group
        </NavLink>
      </div>

      <div className="flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="cursor-pointer list-none select-none font-bold text-slate-900"
          >
            User
          </button>
          <div
            className={`absolute right-0 top-[110%] bg-white border border-slate-200 rounded-xl p-1 min-w-[180px] shadow-lg ${menuOpen ? 'block' : 'hidden'}`}
          >
            <button type="button" className="w-full border-0 bg-transparent px-2.5 py-2.5 rounded-lg cursor-pointer text-left font-semibold text-slate-900 hover:bg-slate-50">
              Profile
            </button>
            <button type="button" className="w-full border-0 bg-transparent px-2.5 py-2.5 rounded-lg cursor-pointer text-left font-semibold text-slate-900 hover:bg-slate-50">
              Settings
            </button>
            <button
              type="button"
              className="w-full border-0 bg-transparent px-2.5 py-2.5 rounded-lg cursor-pointer text-left font-semibold text-slate-900 hover:bg-slate-50"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}