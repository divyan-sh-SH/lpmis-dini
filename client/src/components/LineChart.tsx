import { useState } from 'react';
import type { Transaction } from '../types/dashboard';

type Period = 'week' | 'month';
type Point = { date: string; amount: number; label: string };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const VW = 500, VH = 160;
const P = { t: 12, r: 12, b: 32, l: 52 };
const CW = VW - P.l - P.r;
const CH = VH - P.t - P.b;

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function buildPoints(transactions: Transaction[], period: Period): Point[] {
  const start = getPeriodStart(period);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const d = new Date(t.date);
    if (d < start || d > end) continue;
    const key = t.date.substring(0, 10);
    map.set(key, (map.get(key) || 0) + t.amount);
  }

  const points: Point[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = cur.toISOString().split('T')[0];
    const label = period === 'week' ? DAYS[cur.getDay()] : String(cur.getDate());
    points.push({ date: dateStr, amount: map.get(dateStr) || 0, label });
    cur.setDate(cur.getDate() + 1);
  }
  return points;
}

function fmtAmount(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

type LineChartProps = {
  transactions: Transaction[];
  onPeriodChange?: (period: Period) => void;
};

export default function LineChart({ transactions, onPeriodChange }: LineChartProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [hovered, setHovered] = useState<number | null>(null);

  const data = buildPoints(transactions, period);
  const maxVal = Math.max(...data.map((d) => d.amount), 1);

  const toX = (i: number) =>
    P.l + (data.length > 1 ? (i / (data.length - 1)) * CW : CW / 2);
  const toY = (v: number) => P.t + (1 - v / maxVal) * CH;

  const pts = data.map((d, i) => ({ ...d, x: toX(i), y: toY(d.amount) }));
  const hasData = data.some((d) => d.amount > 0);

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = pts.length > 0
    ? `${linePath}L${pts[pts.length - 1].x.toFixed(1)},${(P.t + CH).toFixed(1)}L${pts[0].x.toFixed(1)},${(P.t + CH).toFixed(1)}Z`
    : '';

  const yLevels = [0, 0.5, 1].map((r) => ({ v: maxVal * r, y: toY(maxVal * r) }));

  const zoneW = pts.length > 1 ? CW / pts.length : CW;

  function changePeriod(p: Period) {
    setPeriod(p);
    onPeriodChange?.(p);
  }

  const hp = hovered !== null ? pts[hovered] : null;
  const tooltipX = hp ? Math.min(Math.max(hp.x, P.l + 40), VW - P.r - 40) : 0;

  return (
    <div>
      {/* Filter buttons */}
      <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['week', 'month'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => changePeriod(p)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              period === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative w-full" style={{ height: 160 }}>
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            No expenses recorded for this period.
          </div>
        )}
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          height="100%"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines + Y labels */}
          {yLevels.map(({ v, y }, i) => (
            <g key={i}>
              <line x1={P.l} y1={y} x2={VW - P.r} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={P.l - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {fmtAmount(v)}
              </text>
            </g>
          ))}

          {/* Bottom axis line */}
          <line x1={P.l} y1={P.t + CH} x2={VW - P.r} y2={P.t + CH} stroke="#e2e8f0" strokeWidth="1" />

          {/* Area + line */}
          {hasData && <path d={areaPath} fill="url(#lc-grad)" />}
          {hasData && (
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* X-axis labels */}
          {pts.map((p, i) => {
            const skip = period === 'month' && pts.length > 15;
            const show = !skip || i % 5 === 0 || i === pts.length - 1;
            return show ? (
              <text key={i} x={p.x} y={VH - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">
                {p.label}
              </text>
            ) : null;
          })}

          {/* Hover zones */}
          {pts.map((p, i) => (
            <rect
              key={i}
              x={p.x - zoneW / 2}
              y={P.t}
              width={zoneW}
              height={CH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHovered(i)}
            />
          ))}

          {/* Hover indicator */}
          {hp && (
            <g>
              <line x1={hp.x} y1={P.t} x2={hp.x} y2={P.t + CH} stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
              <circle cx={hp.x} cy={hp.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
              <rect x={tooltipX - 40} y={hp.y - 30} width="80" height="20" rx="4" fill="#1e293b" opacity="0.85" />
              <text x={tooltipX} y={hp.y - 17} textAnchor="middle" fontSize="9" fill="white">
                {hp.date} · Rs.{hp.amount}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
