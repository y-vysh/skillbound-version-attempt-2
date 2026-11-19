import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function ForgotPasswordPage() {
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; devResetCode?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.devResetCode) {
        setDevCodeHint(res.devResetCode);
        setCode(res.devResetCode);
      }
      setStep('confirm');
      showToast('Verification code generated.', 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      showToast('Password updated! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            aria-label="Back to login"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#464554] hover:bg-[#eff4ff]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-display font-bold text-lg text-[#4338ca]">Reset Password</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#4338ca] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-[#0b1c30]">
                {step === 'request' ? 'Forgot Password?' : 'Verify & Set New Password'}
              </h1>
              <p className="text-xs text-[#464554]">
                {step === 'request'
                  ? 'Enter your account email to generate a 6-digit verification code.'
                  : 'Enter your verification code and choose a new password.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {devCodeHint && (
            <div className="p-3.5 rounded-xl bg-[#eff4ff] text-[#2a14b4] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Local Prototype Code: <strong className="font-mono">{devCodeHint}</strong>
              </span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-email" className="text-sm font-medium text-[#0b1c30]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777586] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya.lin@columbia.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#4338ca] text-white text-sm font-semibold hover:bg-[#2a14b4] transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-code" className="text-sm font-medium text-[#0b1c30]">
                  6-Digit Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="px-3.5 py-2.5 rounded-lg border border-[#c7c4d7] text-sm font-mono focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-new-pass" className="text-sm font-medium text-[#0b1c30]">
                  New Password (min 8 chars, 1 number)
                </label>
                <input
                  id="reset-new-pass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="px-3.5 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#4338ca] text-white text-sm font-semibold hover:bg-[#2a14b4] transition-colors"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
