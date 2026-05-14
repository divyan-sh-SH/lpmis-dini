import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotesEditor from '../components/NotesEditor';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';

export default function PersonalNotesPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return null;

  return (
    <div className="w-full">
      {/* Show back link + hero only when browsing the list */}
      {!isEditing && (
        <>
          <Link
            to="/personal"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Back to MyDash
          </Link>

          {/* Hero banner */}
          <div className="mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 px-6 py-6 text-white shadow-lg shadow-indigo-200/50">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 right-16 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <NoteAltRoundedIcon sx={{ fontSize: 28 }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{user.username}'s Notes</h1>
                <p className="text-sm text-indigo-200 mt-0.5">Your personal space to write and reflect</p>
              </div>
            </div>
          </div>
        </>
      )}

      <NotesEditor
        userId={user.user_id}
        hideTitle
        onViewChange={(v) => setIsEditing(v === 'editor')}
      />
    </div>
  );
}
