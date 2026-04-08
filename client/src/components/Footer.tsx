import { APP_VERSION } from '../constants';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200/50 pt-4 text-center text-sm text-slate-500">
      HomeDash <span className="font-semibold text-slate-800">v{APP_VERSION}</span>
    </footer>
  );
}
