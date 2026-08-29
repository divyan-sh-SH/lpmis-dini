import type { CalendarEvent, Habit, HabitLog, Todo } from '../types/dashboard';
import { deleteCalendarEvent, toggleTodoComplete } from '../lib/moneyApi';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

type Props = {
  date: string;
  isToday: boolean;
  events: CalendarEvent[];
  habits: Habit[];
  logs: HabitLog[];
  todos: Todo[];
  onAddEvent: (date: string) => void;
  onRefresh: () => void;
};

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

function formatDateHeader(dateStr: string, isToday: boolean): string {
  const d = new Date(dateStr + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return (isToday ? 'Today · ' : '') + d.toLocaleDateString(undefined, opts);
}

export default function CalendarDateCard({ date, isToday, events, habits, logs, todos, onAddEvent, onRefresh }: Props) {
  const logByHabit = new Map(logs.filter((l) => l.date === date).map((l) => [l.habit_id, l]));
  const doneTodos = todos.filter((t) => t.completed).length;
  const hasContent = events.length > 0 || habits.length > 0 || todos.length > 0;

  async function handleDeleteEvent(event_id: string) {
    try { await deleteCalendarEvent(event_id); onRefresh(); } catch { /* silent */ }
  }

  async function handleToggleTodo(todo_id: string) {
    try { await toggleTodoComplete(todo_id); onRefresh(); } catch { /* silent */ }
  }

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${isToday ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
      <div className={`flex items-center justify-between px-4 py-2 ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
        <span className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-indigo-700' : 'text-slate-500'}`}>
          {formatDateHeader(date, isToday)}
        </span>
        <button
          onClick={() => onAddEvent(date)}
          className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition"
        >
          <AddRoundedIcon sx={{ fontSize: 12 }} /> Event
        </button>
      </div>

      {!hasContent ? (
        <div className="px-4 py-3 text-xs text-slate-400">Nothing scheduled</div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {events.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Events</div>
              <div className="flex flex-col gap-1.5">
                {events.map((ev) => (
                  <div key={ev.event_id} className="flex items-start gap-2 group">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-700 truncate">{ev.title}</div>
                      {(ev.time_start || ev.time_end) && (
                        <div className="text-xs text-slate-400">
                          {ev.time_start}{ev.time_start && ev.time_end ? ' – ' : ''}{ev.time_end}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.event_id)}
                      className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                    >
                      <DeleteRoundedIcon sx={{ fontSize: 13 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {habits.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Habits ({logs.filter((l) => l.date === date && l.completed).length}/{habits.length})
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {habits.map((habit) => {
                  const log = logByHabit.get(habit.habit_id);
                  const done = log?.completed ?? false;
                  return (
                    <div
                      key={habit.habit_id}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${done ? 'bg-emerald-50' : 'bg-slate-100'}`}
                    >
                      <div className={`h-3.5 w-3.5 rounded-full border-[1.5px] flex items-center justify-center text-[9px] font-bold shrink-0 ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                        {done ? '✓' : ''}
                      </div>
                      <span className={`text-xs font-semibold truncate ${done ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {habit.name}
                        {habit.target_value && log?.value != null ? ` ${log.value}/${habit.target_value}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {todos.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Todos ({doneTodos}/{todos.length} done)
              </div>
              <div className="flex flex-col gap-1">
                {todos.map((todo) => (
                  <div key={todo.todo_id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTodo(todo.todo_id)}
                      className={`h-4 w-4 rounded border-[1.5px] flex items-center justify-center text-[9px] font-bold shrink-0 transition ${
                        todo.completed ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {todo.completed ? '✓' : ''}
                    </button>
                    <span className={`flex-1 text-xs min-w-0 truncate ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                      {todo.title}
                    </span>
                    <span className={`text-[10px] font-bold rounded px-1 py-0.5 shrink-0 ${PRIORITY_STYLE[todo.priority]}`}>
                      {todo.priority[0].toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
