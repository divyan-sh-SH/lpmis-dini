import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getGroupTodos, createTodo, updateTodo,
  getGroupsForUser,
} from '../lib/moneyApi';
import type { Todo, TodoCreate, TodoUpdate } from '../types/dashboard';
import TodoList from '../components/TodoList';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function GroupTodosPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [groupName, setGroupName] = useState('Group');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !groupId) return;
    getGroupsForUser(user.user_id).then((groups) => {
      const match = groups.find((g) => g.group_id === groupId);
      if (match) setGroupName(match.group_name);
    }).catch(() => {});
  }, [user, groupId]);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupTodos(groupId);
      setTodos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data: TodoCreate) {
    await createTodo({ ...data, group_id: groupId });
    await load();
  }

  async function handleUpdate(todo_id: string, data: TodoUpdate) {
    await updateTodo(todo_id, data);
    await load();
  }

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="w-full">
      <header className="mb-5 flex items-center gap-3">
        <Link to={`/groups/${groupId}`} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{groupName} To-Dos</h1>
          {!loading && (
            <p className="text-xs text-slate-500 mt-0.5">
              {doneCount} / {todos.length} done
            </p>
          )}
        </div>
      </header>

      {loading && <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading…</div>}
      {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && (
        <TodoList
          todos={todos}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onRefresh={load}
        />
      )}
    </div>
  );
}
