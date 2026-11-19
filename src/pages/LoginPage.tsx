import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.full_name}!`);
      navigate(user.role === 'admin' && from === '/dashboard' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoStudent = () => {
    setEmail('maya.lin@columbia.edu');
    setPassword('SkillBound2025');
    setError('');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@skillbound.edu');
    setPassword('AdminSkill2025');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#464554] hover:bg-[#eff4ff]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/aistudio/Image_2_5cee0444.jpeg"
              alt="SkillBound Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-lg text-[#4338ca]">SkillBound</span>
          </Link>
        </div>
        <Link to="/signup" className="text-sm font-semibold text-[#4338ca] hover:underline">
          Create Account
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-[#e5eeff] flex items-center justify-center p-1.5 shadow-sm">
              <img
                src="/assets/aistudio/Image_2_5cee0444.jpeg"
                alt="SkillBound Emblem"
                className="w-full h-full rounded-xl object-cover"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000767] bg-[#e0e0ff] px-3 py-1 rounded-lg">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Verified Peer Network</span>
            </div>
            <h1 className="font-display font-bold text-3xl text-[#0b1c30]">Sign in to SkillBound</h1>
            <p className="text-sm text-[#464554]">
              Continue swapping skills and managing sessions with your peers.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-start gap-2.5 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 flex flex-col gap-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-[#0b1c30]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777586] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya.lin@columbia.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c7c4d7] bg-white text-sm text-[#0b1c30] focus:outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#e0e0ff]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-[#0b1c30]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#4338ca] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#777586] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-[#c7c4d7] bg-white text-sm text-[#0b1c30] focus:outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#e0e0ff]"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#464554] hover:text-[#0b1c30]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-[#2a14b4] hover:bg-[#4338ca] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
              >
                <span>{submitting ? 'Signing in...' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Demo Credentials Box */}
            <div className="pt-4 border-t border-[#e2e8f0] flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-[#464554]">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fillDemoStudent}
                  className="px-3 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] text-[#4338ca] text-xs font-semibold transition-colors text-center"
                >
                  Fill Student Demo
                </button>
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="px-3 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4338ca]" />
                  <span>Fill Admin Demo</span>
                </button>
              </div>
              <p className="text-[11px] text-[#64748b]">
                Student: maya.lin@columbia.edu / SkillBound2025 · Admin: admin@skillbound.edu / AdminSkill2025
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-[#464554]">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#4338ca] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
