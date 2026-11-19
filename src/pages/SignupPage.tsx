import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Shield,
  Upload,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SignupPage() {
  const { register, showToast } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('Junior');
  const [location, setLocation] = useState('Columbia University');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!hasMinLength || !hasNumber) {
      setError('Password must be at least 8 characters and include at least 1 number.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service and Reciprocal Honor Code.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('major', major.trim());
      formData.append('year', year);
      formData.append('location', location.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await register(formData);
      showToast('Account created! Welcome to SkillBound.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
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
        <Link to="/login" className="text-sm font-semibold text-[#4338ca] hover:underline">
          Log In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg flex flex-col gap-5">
          <div className="text-center flex flex-col items-center gap-2">
            <h1 className="font-display font-bold text-3xl text-[#0b1c30]">Join SkillBound</h1>
            <p className="text-sm text-[#464554] max-w-sm">
              Exchange skills 1-for-1 with peers. Create your learning &amp; teaching profile.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-start gap-2.5 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 flex flex-col gap-4"
          >
            {/* Optional Profile Picture Upload */}
            <div className="flex items-center gap-4 pb-2 border-b border-[#f1f5f9]">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-14 h-14 rounded-full object-cover border border-[#e2e8f0]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#e0e0ff] text-[#3730a3] flex items-center justify-center font-bold text-sm">
                  {fullName ? fullName.slice(0, 2).toUpperCase() : 'SB'}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0b1c30]">Profile Picture (Optional)</label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#4338ca] text-xs font-semibold cursor-pointer hover:bg-[#e5eeff] w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarFile ? 'Change Photo' : 'Upload Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-name" className="text-sm font-medium text-[#0b1c30]">
                  Full Name *
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Maya Lin"
                  className="px-3.5 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#e0e0ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="signup-email" className="text-sm font-medium text-[#0b1c30]">
                  Email Address *
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@university.edu"
                  className="px-3.5 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#e0e0ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 sm:col-span-1">
                <label htmlFor="signup-major" className="text-sm font-medium text-[#0b1c30]">
                  Field / Major
                </label>
                <input
                  id="signup-major"
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Computer Science"
                  className="px-3 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-year" className="text-sm font-medium text-[#0b1c30]">
                  Level / Year
                </label>
                <select
                  id="signup-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-[#c7c4d7] text-sm bg-white focus:outline-none focus:border-[#4338ca]"
                >
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Professional">Peer Learner</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-location" className="text-sm font-medium text-[#0b1c30]">
                  Campus / City
                </label>
                <input
                  id="signup-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Columbia University"
                  className="px-3 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-pass" className="text-sm font-medium text-[#0b1c30]">
                Password *
              </label>
              <div className="relative">
                <input
                  id="signup-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full px-3.5 pr-11 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#e0e0ff]"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#464554]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#2a14b4] font-medium' : 'text-[#64748b]'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>Min. 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#2a14b4] font-medium' : 'text-[#64748b]'}`}>
                  {hasNumber ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>At least 1 number</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="signup-confirm" className="text-sm font-medium text-[#0b1c30]">
                Confirm Password *
              </label>
              <input
                id="signup-confirm"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="px-3.5 py-2.5 rounded-lg border border-[#c7c4d7] text-sm focus:outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#e0e0ff]"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-[#ba1a1a]">Passwords do not match.</p>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded text-[#4338ca] focus:ring-[#4338ca]"
              />
              <span className="text-xs text-[#464554] leading-relaxed">
                I agree to the <span className="text-[#4338ca] font-medium">Terms of Service</span> and{' '}
                <span className="text-[#4338ca] font-medium">Reciprocal Honor Code</span> (1-for-1 collaborative learning).
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-[#4338ca] hover:bg-[#2a14b4] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>

            <p className="text-center text-sm text-[#464554]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#4338ca] hover:underline">
                Log In
              </Link>
            </p>
          </form>

          <div className="p-3.5 rounded-xl bg-[#eff4ff] flex items-center gap-3 text-xs text-[#464554]">
            <Shield className="w-5 h-5 text-[#4338ca] shrink-0" />
            <span>Profiles are peer-reviewed and designed for mutual 1-for-1 knowledge exchange.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
