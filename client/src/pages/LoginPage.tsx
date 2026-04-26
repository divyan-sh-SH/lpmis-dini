import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (otp.length !== 4) {
      setError('Please enter your 4-digit password.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await login(phone, otp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center py-6">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Logo + Title */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src="/homedash.svg"
            alt="Homedash logo"
            className="h-12 w-12 rounded-2xl object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Welcome to</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Homedash</h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
          <div className="flex overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <span className="flex shrink-0 items-center bg-slate-800 px-3 text-sm text-slate-400">
              +91
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit phone number"
              className="w-full bg-slate-900 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>

          {/* OTP / Password */}
          <input
            type="password"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="4-digit password"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 transition"
          />

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#3FCAD2] to-[#20686C] py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Login to Homedash'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
