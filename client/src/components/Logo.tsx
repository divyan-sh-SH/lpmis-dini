export default function Logo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="HomeDash logo">
      <img className="w-8 h-8 rounded-[10px]" src="/homedash.svg" alt="HomeDash" />
      <span className="text-base font-extrabold tracking-tight">HomeDash</span>
    </div>
  );
}

