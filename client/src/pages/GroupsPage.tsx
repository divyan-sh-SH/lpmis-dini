import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useAuth } from '../contexts/AuthContext';
import { getGroupsForUser, getAllUsers, createGroup } from '../lib/moneyApi';
import type { Group, GroupCreate, User } from '../types/dashboard';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupCreate>({
    name: '',
    users: [],
    created_by: user?.user_id || 0,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [groupsData, usersData] = await Promise.all([
        getGroupsForUser(user.user_id),
        getAllUsers(),
      ]);
      setGroups(groupsData);
      setAllUsers(usersData.filter((u) => u.user_id !== user.user_id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!user) return;
    if (!groupForm.name.trim() || groupForm.users.length === 0) {
      setError('Group name and at least one member are required.');
      return;
    }
    try {
      await createGroup({ ...groupForm, users: [user.user_id, ...groupForm.users], created_by: user.user_id });
      setShowCreateModal(false);
      setGroupForm({ name: '', users: [], created_by: user.user_id });
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create group');
    }
  }

  const toggleMember = (userId: number) => {
    setGroupForm((prev) => ({
      ...prev,
      users: prev.users.includes(userId)
        ? prev.users.filter((id) => id !== userId)
        : [...prev.users, userId],
    }));
  };

  return (
    <div className="w-full">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MyHomeDash</h1>
          <p className="text-slate-500 mt-1">My HomeDash List — manage your shared groups.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Create Group
        </button>
      </header>

      {loading && <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {groups.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          No groups yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {groups.map((group) => {
            const initials = group.group_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <Link
                key={group.group_id}
                to={`/groups/${group.group_id}`}
                className="no-underline group"
              >
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900">{group.group_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{group.users.length} member{group.users.length !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRightRoundedIcon sx={{ fontSize: 18 }} className="shrink-0 text-slate-300 group-hover:text-blue-400 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Create Group</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }} className="space-y-4">
              <label className="block text-sm font-medium">
                Group Name
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  required
                />
              </label>
              <div>
                <p className="text-sm font-medium mb-2">Add Members</p>
                <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 p-3 space-y-1">
                  {allUsers.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-2">No other users found.</p>
                  ) : (
                    allUsers.map((u) => (
                      <label key={u.user_id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupForm.users.includes(u.user_id)}
                          onChange={() => toggleMember(u.user_id)}
                          className="rounded"
                        />
                        <span className="text-sm">{u.username}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" disabled={!groupForm.name.trim() || groupForm.users.length === 0} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
