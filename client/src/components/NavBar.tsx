import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import MyDashIcon from './icons/MyDashIcon';
import MyHomeDashIcon from './icons/MyHomeDashIcon';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';

function formatPhone(id: number | string): string {
  const s = String(id);
  if (s.length === 10) return `${s.slice(0, 5)} ${s.slice(5)}`;
  return s;
}

export default function NavBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const initials = user?.username
    ? user.username.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
    <nav className="sticky top-0 z-10 -mx-5 mb-5 bg-white/85 backdrop-blur-[10px] border-b border-slate-200/90 p-3.5 flex items-center justify-between gap-4">
      <Link to="/" className="no-underline text-inherit" aria-label="Go to HomeDash home">
        <Logo />
      </Link>

      <div className="flex gap-1 items-center">
        <NavLink
          to="/personal"
          className={({ isActive }) =>
            `no-underline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-blue-50 text-blue-500 border-blue-300/35' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <MyDashIcon size={16} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
              <span className="hidden sm:inline">My Dash</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `no-underline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-300/35' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <MyHomeDashIcon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="hidden sm:inline">My HomeDash</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `no-underline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-semibold border border-transparent transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300/35 ${isActive ? 'bg-purple-50 text-purple-600 border-purple-300/35' : ''}`
          }
        >
          <SmartToyRoundedIcon sx={{ fontSize: 16 }} />
          <span className="hidden sm:inline">Chat</span>
        </NavLink>
      </div>

      <div className="flex justify-end">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="flex items-center gap-1 cursor-pointer select-none font-bold text-slate-900 hover:text-slate-600 transition"
          >
            <AccountCircleRoundedIcon sx={{ fontSize: 26 }} />
          </button>
          <div
            className={`absolute right-0 top-[110%] bg-white border border-slate-200 rounded-xl p-1 min-w-[180px] shadow-lg transition-all ${menuOpen ? 'block' : 'hidden'}`}
          >
            <button
              type="button"
              className="w-full border-0 bg-transparent px-2.5 py-2.5 rounded-lg cursor-pointer text-left font-semibold text-slate-900 hover:bg-slate-50"
              onClick={() => { setMenuOpen(false); setShowProfile(true); }}
            >
              Profile
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

    {/* ── Profile modal ── */}
    {showProfile && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}
      >
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 px-6 pt-8 pb-12 text-white text-center">
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </button>
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
              {initials}
            </div>
            <h2 className="text-xl font-bold">{user?.username ?? 'User'}</h2>
            <p className="mt-0.5 text-sm text-blue-200">HomeDash Member</p>
          </div>

          {/* Info cards */}
          <div className="-mt-6 mx-5 rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <BadgeRoundedIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Display name</p>
                <p className="text-sm font-semibold text-slate-800">{user?.username ?? '—'}</p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                <PhoneRoundedIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-800">{user?.user_id ? formatPhone(user.user_id) : '—'}</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="w-full rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Logout confirm ── */}
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
