import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotesEditor from '../components/NotesEditor';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';

export default function PersonalNotesPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="w-full">
      {/* Back nav */}
      <Link
        to="/personal"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Back to MyDash
      </Link>

      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
          <NoteAltRoundedIcon sx={{ fontSize: 22 }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user.username}'s Notes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Your personal notes and thoughts</p>
        </div>
      </div>

      <NotesEditor userId={user.user_id} hideTitle />
    </div>
  );
}
