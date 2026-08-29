import { useState } from 'react';
import type { Todo, TodoCreate, TodoUpdate } from '../types/dashboard';
import { toggleTodoComplete, deleteTodo } from '../lib/moneyApi';
import TodoFormModal from './TodoFormModal';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

type Filter = 'all' | 'active' | 'done';

type Props = {
  todos: Todo[];
  onAdd: (data: TodoCreate) => Promise<void>;
  onUpdate: (todo_id: string, data: TodoUpdate) => Promise<void>;
  onRefresh: () => void;
};

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

export default function TodoList({ todos, onAdd, onUpdate, onRefresh }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  async function handleToggle(todo_id: string) {
    try {
      await toggleTodoComplete(todo_id);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  async function handleDelete(todo_id: string) {
    try {
      await deleteTodo(todo_id);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  const filterCls = (f: Filter) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={filterCls(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
        >
          <AddRoundedIcon sx={{ fontSize: 15 }} /> Add
        </button>
      </div>

      {error && <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-400">
          {filter === 'done' ? 'No completed todos yet.' : 'Nothing here. Tap + Add to create one.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((todo) => (
            <div
              key={todo.todo_id}
              className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition ${todo.completed ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}
            >
              <button
                onClick={() => handleToggle(todo.todo_id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition ${
                  todo.completed ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {todo.completed ? '✓' : ''}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {todo.title}
                </div>
                {todo.description && (
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{todo.description}</div>
                )}
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${PRIORITY_STYLE[todo.priority]}`}>
                    {todo.priority}
                  </span>
                  {todo.due_date && (
                    <span className="text-[11px] text-slate-400">{todo.due_date}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setEditing(todo); setShowModal(true); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <EditRoundedIcon sx={{ fontSize: 15 }} />
                </button>
                <button
                  onClick={() => handleDelete(todo.todo_id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                >
                  <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TodoFormModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={async (data) => {
            if (editing) {
              await onUpdate(editing.todo_id, data as TodoUpdate);
            } else {
              await onAdd(data as TodoCreate);
            }
          }}
        />
      )}
    </div>
  );
}
