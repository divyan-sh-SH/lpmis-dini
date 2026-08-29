import type { Habit, HabitLog } from '../types/dashboard';
import { upsertHabitLog } from '../lib/moneyApi';

type Props = {
  habits: Habit[];
  logs: HabitLog[];
  date: string;
  onLogsChange: () => void;
};

function computeStreak(habitId: string, logs: HabitLog[]): number {
  const sorted = logs
    .filter((l) => l.habit_id === habitId && l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();
  if (!sorted.length) return 0;
  let streak = 0;
  let expected = new Date();
  for (const d of sorted) {
    const day = new Date(d + 'T00:00:00');
    const diff = Math.round((expected.getTime() - day.getTime()) / 86400000);
    if (diff > 1) break;
    streak++;
    expected = day;
  }
  return streak;
}


export default function HabitCheckInGrid({ habits, logs, date, onLogsChange }: Props) {
  const logByHabit = new Map(logs.map((l) => [l.habit_id, l]));

  async function handleBooleanToggle(habit: Habit) {
    const existing = logByHabit.get(habit.habit_id);
    try {
      await upsertHabitLog({
        habit_id: habit.habit_id,
        date,
        completed: !existing?.completed,
        value: null,
      });
      onLogsChange();
    } catch {
      // silently fail on toggle
    }
  }

  async function handleValueChange(habit: Habit, delta: number) {
    const existing = logByHabit.get(habit.habit_id);
    const currentVal = existing?.value ?? 0;
    const newVal = Math.max(0, currentVal + delta);
    const target = habit.target_value ?? 1;
    try {
      await upsertHabitLog({
        habit_id: habit.habit_id,
        date,
        completed: newVal >= target,
        value: newVal,
      });
      onLogsChange();
    } catch {
      // silently fail
    }
  }

  if (!habits.length) {
    return (
      <div className="rounded-2xl bg-slate-100 px-5 py-8 text-center text-sm text-slate-500">
        No active habits. Tap <strong>Manage Habits</strong> to add some.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {habits.map((habit) => {
        const log = logByHabit.get(habit.habit_id);
        const isBoolean = habit.target_value == null;
        const done = log?.completed ?? false;
        const value = log?.value ?? 0;
        const target = habit.target_value ?? 1;
        const streak = computeStreak(habit.habit_id, logs);
        const progress = isBoolean ? (done ? 100 : 0) : Math.min(100, Math.round((value / target) * 100));

        return (
          <div
            key={habit.habit_id}
            className={`rounded-2xl border bg-white px-4 py-3 shadow-sm transition ${done ? 'border-emerald-200' : 'border-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold truncate ${done ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {habit.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {isBoolean
                    ? done ? 'Done' : 'Not done'
                    : `${value} / ${target} ${habit.unit || ''}`}
                </div>
              </div>
              {streak > 1 && (
                <span className="text-xs font-bold text-amber-500 shrink-0">🔥 {streak}d</span>
              )}
              {isBoolean ? (
                <button
                  onClick={() => handleBooleanToggle(habit)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 bg-white text-slate-300 hover:border-emerald-400'
                  }`}
                >
                  {done ? '✓' : ''}
                </button>
              ) : (
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleValueChange(habit, 1)}
                    className="h-7 w-7 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleValueChange(habit, -1)}
                    className="h-7 w-7 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition flex items-center justify-center"
                  >
                    −
                  </button>
                </div>
              )}
            </div>
            {!isBoolean && (
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
