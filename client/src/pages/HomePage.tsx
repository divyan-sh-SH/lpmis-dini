import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="w-full">
      <header className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h1 className="text-4xl font-bold tracking-tight mb-2">HomeDash</h1>
        <p className="text-slate-500">
          Manage your personal finances and group expenses.
        </p>
      </header>

      <main>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link to="/personal" className="no-underline text-inherit hover:transform hover:-translate-y-0.5 transition-transform duration-200" aria-label="Go to Personal Dashboard">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-slate-200 shadow-2xl relative overflow-hidden">
              <h2>Me</h2>
              <p className="text-slate-400">Manage your personal transactions, stocks, and carts</p>
              <div className="mt-3 inline-flex items-center gap-1 font-bold text-blue-400">Open →</div>
            </div>
          </Link>

          <Link to="/groups" className="no-underline text-inherit hover:transform hover:-translate-y-0.5 transition-transform duration-200" aria-label="Go to Group Dashboard">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-slate-200 shadow-2xl relative overflow-hidden">
              <h2>My Group</h2>
              <p className="text-slate-400">View and manage group activities</p>
              <div className="mt-3 inline-flex items-center gap-1 font-bold text-blue-400">Open →</div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}

