import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  Award,
  Calendar,
  Flag,
  MapPin,
  MessageSquare,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { PeerMatch, ReviewItem, Skill, User, UserLevelInfo } from '../types';

interface PeerProfileResponse {
  peer: User;
  teachSkills: Skill[];
  learnSkills: Skill[];
  reviews: ReviewItem[];
  achievements: Array<{ id: number; badge_key: string; badge_name: string; unlocked_at: string }>;
  levelInfo: UserLevelInfo;
  matchInfo: PeerMatch | null;
}

export function PeerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, teachSkills: myTeachSkills, showToast } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PeerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [teachSkillName, setTeachSkillName] = useState('');
  const [learnSkillName, setLearnSkillName] = useState('');
  const [proposedSlot, setProposedSlot] = useState('Thu 4:00 PM - 5:00 PM');
  const [proposedLocation, setProposedLocation] = useState('Butler Library');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const loadPeer = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiRequest<PeerProfileResponse>(`/peers/${id}`);
        setProfile(res);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Student profile not found.');
      } finally {
        setLoading(false);
      }
    };
    loadPeer();
  }, [id]);

  const handleOpenSwap = () => {
    if (!user) {
      showToast('Please log in to request a skill swap.', 'info');
      navigate('/login');
      return;
    }
    if (!profile) return;
    setTeachSkillName(
      profile.matchInfo?.youTeachTheyWant[0] || myTeachSkills[0]?.name || 'Peer Mentoring'
    );
    setLearnSkillName(
      profile.matchInfo?.theyTeachYouCanLearn[0] || profile.teachSkills[0]?.name || ''
    );
    setProposedLocation(profile.peer.location || 'Campus Library');
    setMessage(
      `Hi ${profile.peer.full_name.split(' ')[0]}! Would you be open to a 1-on-1 skill swap session this week?`
    );
    setRequestModalOpen(true);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSending(true);
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: profile.peer.id,
          teachSkillName,
          learnSkillName,
          proposedSlot,
          proposedLocation,
          message,
        }),
      });
      showToast(`Learning request sent to ${profile.peer.full_name}`, 'success');
      setRequestModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send request.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      showToast('Please log in to message peers.', 'info');
      navigate('/login');
      return;
    }
    if (!profile) return;
    try {
      const res = await apiRequest<{ conversation: { id: number } }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ peerId: profile.peer.id }),
      });
      navigate(`/messages?conv=${res.conversation.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to start conversation.', 'error');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reportReason.trim()) return;
    setReporting(true);
    try {
      const res = await apiRequest<{ message: string }>(`/peers/${profile.peer.id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason }),
      });
      showToast(res.message, 'info');
      setReportOpen(false);
      setReportReason('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit report.', 'error');
    } finally {
      setReporting(false);
    }
  };

  const body = loading ? (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-white rounded-2xl border border-[#e2e8f0]" />
      <div className="h-56 bg-white rounded-2xl border border-[#e2e8f0]" />
    </div>
  ) : error || !profile ? (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
      <p className="text-sm font-semibold text-[#ba1a1a] mb-4">{error || 'Peer not found.'}</p>
      <Link to="/discover" className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold">
        Back to Discover
      </Link>
    </div>
  ) : (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4338ca] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {user && user.id !== profile.peer.id && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#ba1a1a]"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report User</span>
          </button>
        )}
      </div>

      {/* Profile Header Card */}
      <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Avatar name={profile.peer.full_name} src={profile.peer.avatar_url} size="xl" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[#0b1c30]">
                  {profile.peer.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#4338ca] text-xs font-semibold">
                  Level {profile.levelInfo.level} {profile.levelInfo.title}
                </span>
              </div>
              <p className="text-sm text-[#464554]">
                {profile.peer.major || 'University Student'} · {profile.peer.year || 'Member'} · {profile.peer.experience_level}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748b] pt-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#4338ca]" />
                  {profile.peer.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#4338ca]" />
                  {profile.peer.availability || 'Flexible schedule'}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#0b1c30] tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                  {profile.peer.rating_count > 0
                    ? `${profile.peer.rating_avg.toFixed(1)} (${profile.peer.rating_count} reviews)`
                    : 'New Peer'}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#15803d] tabular-nums">
                  <Award className="w-3.5 h-3.5" />
                  {profile.peer.total_sessions} swaps · {profile.peer.points} pts
                </span>
              </div>
            </div>
          </div>

          {(!user || user.id !== profile.peer.id) && (
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleStartChat}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#eff4ff] text-[#4338ca] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button
                type="button"
                onClick={handleOpenSwap}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Request Exchange</span>
              </button>
            </div>
          )}
        </div>

        {profile.peer.bio && (
          <p className="mt-5 pt-4 border-t border-[#f1f5f9] text-sm text-[#464554] leading-relaxed">
            {profile.peer.bio}
          </p>
        )}
      </section>

      {/* Rule-Based Compatibility Breakdown */}
      {profile.matchInfo && (
        <section
          className={`rounded-2xl border p-5 sm:p-6 ${
            profile.matchInfo.isMutualMatch
              ? 'bg-[#fffbeb] border-[#fcd34d]'
              : 'bg-[#eff4ff] border-[#c3c4da]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#4338ca] flex items-center justify-center shadow-xs shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-[#0b1c30]">
                  {profile.matchInfo.isMutualMatch
                    ? 'Direct Mutual Skill Match'
                    : 'Skill Compatibility Breakdown'}
                </h2>
                <p className="text-xs text-[#464554] mt-0.5">
                  {profile.matchInfo.compatibilityExplanation}
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-white text-[#4338ca] font-display font-bold text-sm tabular-nums shadow-xs self-start sm:self-center">
              {profile.matchInfo.matchPercentage}% Match
            </span>
          </div>

          {(profile.matchInfo.theyTeachYouCanLearn.length > 0 ||
            profile.matchInfo.youTeachTheyWant.length > 0) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/90 rounded-xl p-3 border border-white">
                <p className="font-semibold text-[#64748b] mb-1">They Teach & You Want</p>
                <p className="font-bold text-[#0b1c30]">
                  {profile.matchInfo.theyTeachYouCanLearn.join(', ') || 'Browse their full skill list below'}
                </p>
              </div>
              <div className="bg-white/90 rounded-xl p-3 border border-white">
                <p className="font-semibold text-[#64748b] mb-1">You Teach & They Want</p>
                <p className="font-bold text-[#0b1c30]">
                  {profile.matchInfo.youTeachTheyWant.join(', ') || 'Complementary peer interest'}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Skills Taught & Wanted */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0b1c30]">
            Skills Offered ({profile.teachSkills.length})
          </h2>
          {profile.teachSkills.length === 0 ? (
            <p className="text-xs text-[#64748b]">No teaching skills listed yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.teachSkills.map((sk) => (
                <div key={sk.id} className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#0b1c30]">{sk.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#4338ca] text-[11px] font-semibold">
                      {sk.proficiency}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#64748b] mt-0.5">{sk.category}</p>
                  {sk.description && (
                    <p className="text-xs text-[#464554] mt-2">{sk.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0b1c30]">
            Skills Seeking ({profile.learnSkills.length})
          </h2>
          {profile.learnSkills.length === 0 ? (
            <p className="text-xs text-[#64748b]">No learning goals listed yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.learnSkills.map((sk) => (
                <div key={sk.id} className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#0b1c30]">{sk.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#464554] text-[11px] font-semibold">
                      Target: {sk.proficiency}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#64748b] mt-0.5">{sk.category}</p>
                  {sk.description && (
                    <p className="text-xs text-[#464554] mt-2">{sk.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Peer Reviews */}
      <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-[#0b1c30]">
          Peer Reviews ({profile.reviews.length})
        </h2>
        {profile.reviews.length === 0 ? (
          <p className="text-xs text-[#64748b]">No reviews received yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.reviews.map((rev) => {
              let tags: string[] = [];
              try {
                tags = JSON.parse(rev.tags_json || '[]');
              } catch {
                tags = [];
              }
              return (
                <div key={rev.id} className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={rev.reviewer_name} src={rev.reviewer_avatar} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-[#0b1c30]">{rev.reviewer_name}</p>
                        <p className="text-[11px] text-[#64748b]">{rev.reviewer_major}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#cbd5e1]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && <p className="text-xs text-[#464554]">{rev.comment}</p>}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#e2e8f0] text-[10px] font-semibold text-[#4338ca]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Request Exchange Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">
                Request Skill Exchange
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setRequestModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Skill You Teach
                </label>
                <input
                  type="text"
                  required
                  value={teachSkillName}
                  onChange={(e) => setTeachSkillName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Skill You Want to Learn
                </label>
                <input
                  type="text"
                  required
                  value={learnSkillName}
                  onChange={(e) => setLearnSkillName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Proposed Slot
                  </label>
                  <input
                    type="text"
                    required
                    value={proposedSlot}
                    onChange={(e) => setProposedSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={proposedLocation}
                    onChange={(e) => setProposedLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="font-display font-bold text-lg text-[#0b1c30] mb-2">
              Report {profile.peer.full_name}
            </h3>
            <p className="text-xs text-[#464554] mb-4">
              Campus administrators review all safety or honor code reports promptly.
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Describe the issue..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#ba1a1a]"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-4 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (user) {
    return <AppShell>{body}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#e2e8f0] px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/Image_2_5cee0444.jpeg"
            alt="SkillBound Logo"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-display font-bold text-lg text-[#4338ca]">SkillBound</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-[#4338ca]">
            Log In
          </Link>
          <Link to="/signup" className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold">
            Sign Up
          </Link>
        </div>
      </header>
      <main className="max-w-[1120px] mx-auto px-4 sm:px-8 py-6">{body}</main>
    </div>
  );
}
