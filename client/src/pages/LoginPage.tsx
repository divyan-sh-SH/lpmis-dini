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
      setError('Please enter a valid 4-digit OTP as your password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(phone, otp);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-16">
      <div className="mx-auto bg-slate-950/80 flex w-full max-w-lg flex-col gap-8 rounded-[2rem] border p-8">
        <div className="flex items-center gap-4 rounded-3xl p-5">
            <img src="/homedash.svg" alt="Homedash logo" className="h-14 w-14 object-contain rounded-[1rem]" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Welcome to</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Homedash</h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-2 flex overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80 shadow-inner shadow-slate-950/40">
              <span className="flex items-center px-4 bg-slate-700/80 text-sm text-slate-300">+91</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit phone"
                className="w-full bg-white px-4 py-4 text-lg text-black outline-none placeholder:text-slate-500"
              />
            </div>
            <input
              type="password"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter Password (OTP)"
              className="w-full bg-white rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4 text-lg text-black outline-none placeholder:text-slate-500"
            />
          </div>

          {error && <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[1.5rem] bg-gradient-to-r from-[#3FCAD2] to-[#20686C] px-6 py-4 text-base font-semibold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Login to Homedash'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
