import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserTodos, createTodo, updateTodo } from '../lib/moneyApi';
import type { Todo, TodoCreate, TodoUpdate } from '../types/dashboard';
import TodoList from '../components/TodoList';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function PersonalTodosPage() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserTodos(user.user_id);
      setTodos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data: TodoCreate) {
    await createTodo({ ...data, user_id: user!.user_id });
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
        <Link to="/personal" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">To-Do List</h1>
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
