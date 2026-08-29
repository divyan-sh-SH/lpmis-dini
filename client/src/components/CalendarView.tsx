import { useState, useCallback } from 'react';
import type { CalendarEvent, Habit, HabitLog, Todo, CalendarEventCreate, CalendarEventUpdate } from '../types/dashboard';
import { createCalendarEvent, updateCalendarEvent } from '../lib/moneyApi';
import CalendarDateCard from './CalendarDateCard';
import AddEventModal from './AddEventModal';

type DateEntry = {
  date: string;
  events: CalendarEvent[];
  habits: Habit[];
  logs: HabitLog[];
  todos: Todo[];
};

type Props = {
  events: CalendarEvent[];
  habits: Habit[];
  logs: HabitLog[];
  todos: Todo[];
  scope: { user_id?: number; group_id?: string };
  onRefresh: () => void;
};

function getDatesRange(daysBack: number, daysForward: number): string[] {
  const dates: string[] = [];
  for (let i = -daysBack; i <= daysForward; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function CalendarView({ events, habits, logs, todos, scope, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState('');

  const dates = getDatesRange(7, 30);
  const today = new Date().toISOString().split('T')[0];

  const buildEntries = useCallback((): DateEntry[] => {
    return dates.map((date) => ({
      date,
      events: events.filter((e) => e.date === date),
      habits,
      logs: logs.filter((l) => l.date === date),
      todos: todos.filter((t) => t.due_date === date),
    }));
  }, [events, habits, logs, todos, dates.join(',')]);

  const entries = buildEntries().filter(
    (e) => e.date === today || e.events.length > 0 || e.todos.length > 0 || e.date >= today
  );

  function openAddEvent(date: string) {
    setEditingEvent(null);
    setDefaultDate(date);
    setShowModal(true);
  }

  async function handleSaveEvent(data: CalendarEventCreate | CalendarEventUpdate) {
    if (editingEvent) {
      await updateCalendarEvent(editingEvent.event_id, data as CalendarEventUpdate);
    } else {
      const createData = { ...data, ...scope } as CalendarEventCreate;
      await createCalendarEvent(createData);
    }
    onRefresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <CalendarDateCard
          key={entry.date}
          date={entry.date}
          isToday={entry.date === today}
          events={entry.events}
          habits={entry.habits}
          logs={entry.logs}
          todos={entry.todos}
          onAddEvent={openAddEvent}
          onRefresh={onRefresh}
        />
      ))}

      {entries.length === 0 && (
        <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
          No upcoming entries. Tap "+ Event" on any date card to add one.
        </div>
      )}

      {showModal && (
        <AddEventModal
          initial={editingEvent}
          defaultDate={defaultDate || today}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
