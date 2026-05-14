import { useMemo, useState } from 'react';
import type { Stock } from '../types/dashboard';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';

type StocksProps = {
  stocks: Stock[];
  onEdit: (stock: Stock) => void;
  onDelete: (stockId: string) => void;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Other: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const COLOR_PALETTE = [
  { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', dot: 'bg-fuchsia-400' },
  { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' },
];

export default function Stocks({ stocks, onEdit, onDelete }: StocksProps) {
  const grouped = useMemo(() => {
    const map: Record<string, Stock[]> = {};
    for (const s of stocks) {
      const cat = s.category?.trim() || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  }, [stocks]);

  // Colors assigned per category name, stable across renders
  const categoryColors = useMemo(() => {
    const result: Record<string, typeof COLOR_PALETTE[0]> = {};
    let idx = 0;
    for (const [cat] of grouped) {
      if (cat === 'Other') {
        result[cat] = CATEGORY_COLORS.Other;
      } else {
        result[cat] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
        idx++;
      }
    }
    return result;
  }, [grouped]);

  // All categories open by default; track closed ones
  const [closedCategories, setClosedCategories] = useState<Set<string>>(new Set());

  function toggle(cat: string) {
    setClosedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        No stocks yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(([category, items]) => {
        const isOpen = !closedCategories.has(category);
        const colors = categoryColors[category] ?? CATEGORY_COLORS.Other;

        return (
          <div
            key={category}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => toggle(category)}
              className="w-full flex items-center justify-between px-4 py-3 gap-3 text-left transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors.bg}`}>
                  <LabelRoundedIcon sx={{ fontSize: 15 }} className={colors.text} />
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>{category}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                  {items.length}
                </span>
              </div>
              <span className="text-slate-400 shrink-0">
                {isOpen
                  ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} />
                  : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />}
              </span>
            </button>

            {isOpen && (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block border-t border-slate-100 overflow-hidden">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Item</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quantity</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s, index) => (
                        <tr
                          key={s.stock_id}
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-blue-50/40 transition-colors`}
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.stock_item}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{s.quantity || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => onEdit(s)}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(s.stock_id)}
                              className="ml-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden border-t border-slate-100 p-3 space-y-2">
                  {items.map((s) => (
                    <div key={s.stock_id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{s.stock_item}</p>
                          {s.quantity && (
                            <p className="text-xs text-slate-500 mt-0.5">Qty: {s.quantity}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => onEdit(s)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(s.stock_id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
