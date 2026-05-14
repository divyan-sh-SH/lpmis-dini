import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroupsForUser } from '../lib/moneyApi';
import NotesEditor from '../components/NotesEditor';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';

export default function GroupNotesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !groupId) return;
    setLoadingGroup(true);
    setNotFound(false);
    getGroupsForUser(user.user_id)
      .then((groups) => {
        const match = groups.find((g) => g.group_id === groupId);
        if (match) {
          setGroupName(match.group_name);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingGroup(false));
  }, [user, groupId]);

  if (!user || !groupId) return null;

  if (loadingGroup) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-500">Group not found or you don't have access.</p>
        <Link
          to="/groups"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Back nav */}
      <Link
        to={`/groups/${groupId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Back to {groupName}
      </Link>

      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
          <NoteAltRoundedIcon sx={{ fontSize: 22 }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {groupName}'s Notes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Shared notes for your group</p>
        </div>
      </div>

      <NotesEditor groupId={groupId} hideTitle />
    </div>
  );
}
