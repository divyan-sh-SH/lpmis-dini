import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    group_name: '',
    users: [],
    created_by: user?.user_id || 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
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
      // Exclude current user from the list
      setAllUsers(usersData.filter(u => u.user_id !== user.user_id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!user) return;
    if (!groupForm.group_name.trim() || groupForm.users.length === 0) {
      setError('Group name and at least one user are required');
      return;
    }
    try {
      await createGroup({...groupForm, users: [user.user_id, ...groupForm.users], created_by: user.user_id });
      setShowCreateModal(false);
      setGroupForm({
        group_name: '',
        users: [],
        created_by: user.user_id,
      });
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create group';
      setError(msg);
    }
  }

  const toggleMember = (userId: number) => {
    setGroupForm(prev => ({
      ...prev,
      users: prev.users.includes(userId)
        ? prev.users.filter(id => id !== userId)
        : [...prev.users, userId]
    }));
  };

  return (
    <div className="w-full">
      <header className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Groups</h1>
        <p className="text-slate-500">Manage your groups and their activities.</p>
      </header>

      {loading && <div className="p-3 rounded-lg bg-blue-100 text-blue-800">Loading data…</div>}
      {error && <div className="p-3 rounded-lg bg-red-100 text-red-800">{error}</div>}

      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Group
        </button>
      </div>

      <div>
        {groups.map((group) => (
          <Link
            key={group.group_id}
            to={`/groups/${group.group_id}`}
            className="no-underline text-inherit hover:transform hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-slate-200 shadow-2xl">
              <h3 className="text-xl font-bold mb-2">{group.group_name}</h3>
            </div>
          </Link>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create Group</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupForm.group_name}
                  onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Add users</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {allUsers.map((u) => (
                    <label key={u.user_id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={groupForm.users.includes(u.user_id)}
                        onChange={() => toggleMember(u.user_id)}
                      />
                      {u.username}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!groupForm.group_name.trim() || groupForm.users.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}