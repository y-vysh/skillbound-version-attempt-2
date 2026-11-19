import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Camera, CheckCircle2, Save, Star } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { ReviewItem } from '../types';

export function ProfilePage() {
  const { user, teachSkills, learnSkills, profileCompletion, levelInfo, refreshMe, showToast } =
    useAuth();

  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [availability, setAvailability] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setMajor(user.major || '');
      setYear(user.year || '');
      setLocation(user.location || '');
      setExperienceLevel(user.experience_level || 'Intermediate');
      setAvailability(user.availability || '');
      setBio(user.bio || '');

      apiRequest<{ reviews: ReviewItem[] }>(`/reviews/user/${user.id}`)
        .then((res) => setReviews(res.reviews))
        .catch(() => {});
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest<{ awardedProfileBonus?: boolean }>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          major,
          year,
          location,
          experience_level: experienceLevel,
          availability,
          bio,
        }),
      });
      await refreshMe();
      if (res.awardedProfileBonus) {
        showToast('Profile saved! +20 bonus points awarded for completing your profile.', 'success');
      } else {
        showToast('Profile updated successfully.', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await apiRequest('/users/avatar', { method: 'POST', body: fd });
      await refreshMe();
      showToast('Profile picture updated!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload image.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Summary Card */}
        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={user.full_name} src={user.avatar_url} size="xl" />
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#4338ca] text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-[#2a14b4]">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="sr-only"
                  />
                </label>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[#0b1c30]">{user.full_name}</h1>
                <p className="text-sm text-[#464554]">{user.email}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#4338ca]">
                    Level {levelInfo?.level ?? 1} · {levelInfo?.title ?? 'Peer Learner'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#0b1c30] tabular-nums">
                    <Award className="w-4 h-4 text-[#f59e0b]" />
                    {user.points} pts · {user.total_sessions} sessions
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#0b1c30] tabular-nums">
                    <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                    {user.rating_count > 0
                      ? `${user.rating_avg.toFixed(1)} (${user.rating_count} reviews)`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-56 p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#0b1c30]">Profile Completion</span>
                <span className="text-[#4338ca] tabular-nums">{profileCompletion}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                <div
                  className="h-full bg-[#4338ca] transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Edit Form */}
          <section className="lg:col-span-7 bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h2 className="font-display text-lg font-bold text-[#0b1c30] mb-4">
              Edit Personal Profile
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Campus / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Columbia Campus"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Major</label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. Junior"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4338ca]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Weekly Availability
                </label>
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Tue/Thu afternoons, Sat mornings"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Bio</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell peers what you love teaching and learning..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          </section>

          {/* Right: Skills Summary & Reviews Received */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0b1c30]">My Listed Skills</h2>
                <Link to="/skills" className="text-xs font-semibold text-[#4338ca] hover:underline">
                  Manage Skills
                </Link>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748b] mb-1.5">
                  Teaching ({teachSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {teachSkills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-[#eff4ff] text-[#4338ca] text-xs font-semibold"
                    >
                      {s.name}
                    </span>
                  ))}
                  {teachSkills.length === 0 && (
                    <span className="text-xs text-[#64748b]">None listed yet</span>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs font-semibold text-[#64748b] mb-1.5">
                  Learning ({learnSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {learnSkills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] text-[#464554] text-xs font-semibold"
                    >
                      {s.name}
                    </span>
                  ))}
                  {learnSkills.length === 0 && (
                    <span className="text-xs text-[#64748b]">None listed yet</span>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-3">
              <h2 className="font-display text-lg font-bold text-[#0b1c30]">
                Reviews Received ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-xs text-[#64748b]">
                  Complete a peer session to start building verified reviews.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0b1c30]">
                          {rev.reviewer_name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#b45309] tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                          {rev.rating}/5
                        </span>
                      </div>
                      {rev.session_title && (
                        <p className="text-[11px] font-semibold text-[#4338ca] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {rev.session_title}
                        </p>
                      )}
                      {rev.comment && <p className="text-xs text-[#464554]">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
