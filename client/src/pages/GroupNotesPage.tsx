import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroupsForUser } from '../lib/moneyApi';
import NotesEditor from '../components/NotesEditor';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';

export default function GroupNotesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const initials = groupName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full">
      {/* Show back link + hero only when browsing the list */}
      {!isEditing && (
        <>
          <Link
            to={`/groups/${groupId}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Back to {groupName}
          </Link>

          {/* Hero banner */}
          <div className="mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 px-6 py-6 text-white shadow-lg shadow-indigo-200/50">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 right-16 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-lg font-bold">
                {initials || <GroupsRoundedIcon sx={{ fontSize: 28 }} />}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{groupName}'s Notes</h1>
                <p className="text-sm text-indigo-200 mt-0.5 flex items-center gap-1">
                  <NoteAltRoundedIcon sx={{ fontSize: 15 }} />
                  Shared notes for your group
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <NotesEditor
        groupId={groupId}
        hideTitle
        onViewChange={(v) => setIsEditing(v === 'editor')}
      />
    </div>
  );
}
