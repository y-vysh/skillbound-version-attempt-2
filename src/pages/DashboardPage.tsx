import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Award,
  BookOpen,
  Calendar,
  Compass,
  Clock,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { DashboardPayload, PeerMatch } from '../types';

export function DashboardPage() {
  const { user: authUser, teachSkills: myTeachSkills, showToast } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Request Modal state
  const [requestPeer, setRequestPeer] = useState<PeerMatch | null>(null);
  const [reqTeachSkill, setReqTeachSkill] = useState('');
  const [reqLearnSkill, setReqLearnSkill] = useState('');
  const [reqSlot, setReqSlot] = useState('Thu 3:00 PM - 4:00 PM');
  const [reqLocation, setReqLocation] = useState('Butler Library, Room 302');
  const [reqMessage, setReqMessage] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DashboardPayload>('/dashboard');
      setData(res);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openRequestModal = (match: PeerMatch) => {
    setRequestPeer(match);
    setReqTeachSkill(
      match.youTeachTheyWant[0] ||
        myTeachSkills[0]?.name ||
        data?.teachSkills[0]?.name ||
        'Peer Mentoring'
    );
    setReqLearnSkill(
      match.theyTeachYouCanLearn[0] || match.teachSkills[0]?.name || ''
    );
    setReqSlot('Tomorrow 3:30 PM - 4:30 PM');
    setReqLocation(match.peer.location || 'Campus Library');
    setReqMessage(
      `Hi ${match.peer.full_name.split(' ')[0]}! We have a ${match.matchPercentage}% match — would love to swap skills this week.`
    );
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestPeer) return;
    setSubmittingReq(true);
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: requestPeer.peer.id,
          teachSkillName: reqTeachSkill,
          learnSkillName: reqLearnSkill,
          proposedSlot: reqSlot,
          proposedLocation: reqLocation,
          message: reqMessage,
        }),
      });
      showToast(`Learning request sent to ${requestPeer.peer.full_name}`, 'success');
      setRequestPeer(null);
      loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send request.', 'error');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleMessagePartner = async (partnerId: number) => {
    try {
      const res = await apiRequest<{ conversation: { id: number } }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ peerId: partnerId }),
      });
      navigate(`/messages?conv=${res.conversation.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open conversation.', 'error');
    }
  };

  const nextSession = data?.upcomingSessions[0] || null;
  const firstName = (data?.user.full_name || authUser?.full_name || 'Student').split(' ')[0];

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-36 bg-white rounded-2xl border border-[#e2e8f0]" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-[#e2e8f0]" />
            ))}
          </div>
          <div className="h-56 bg-white rounded-2xl border border-[#e2e8f0]" />
        </div>
      ) : error || !data ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
          <p className="text-sm font-semibold text-[#ba1a1a] mb-3">{error || 'Unable to load dashboard.'}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome Hero Card */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] text-[#4338ca] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{data.user.location || 'Campus Network'} · Level {data.levelInfo.level} {data.levelInfo.title}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-sm text-[#464554]">
                  Your peer exchange ledger is active. {data.pendingReceivedCount > 0 ? `You have ${data.pendingReceivedCount} incoming swap request${data.pendingReceivedCount > 1 ? 's' : ''}.` : 'Explore complementary peers to schedule your next swap.'}
                </p>
              </div>
              <Link to="/profile" className="flex items-center gap-3 self-start sm:self-center shrink-0">
                <Avatar name={data.user.full_name} src={data.user.avatar_url} size="lg" />
              </Link>
            </div>

            {/* Reciprocal Balance & Profile Completion Bar */}
            <div className="mt-5 pt-4 border-t border-[#f1f5f9] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#4338ca] flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0b1c30] tabular-nums">
                      Reciprocal Ratio: {data.teachSkills.length} Teach · {data.learnSkills.length} Learn
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      {data.user.total_sessions} completed swaps · {data.user.points} pts earned
                    </p>
                  </div>
                </div>
                <Link
                  to="/rewards"
                  className="text-xs font-semibold text-[#4338ca] hover:underline shrink-0"
                >
                  Rewards
                </Link>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0b1c30]">Profile Completion</span>
                  <span className="font-bold text-[#4338ca] tabular-nums">{data.profileCompletion}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4338ca] transition-all"
                    style={{ width: `${data.profileCompletion}%` }}
                  />
                </div>
                {data.profileCompletion < 100 && (
                  <div className="mt-1.5 flex justify-end">
                    <Link to="/profile" className="text-[11px] font-semibold text-[#4338ca] hover:underline">
                      Complete profile for +20 pts →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                to="/skills"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#e0e0ff] text-[#4338ca] text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Compass className="w-4 h-4" />
                <span>Discover Peers</span>
              </Link>
              <Link
                to="/requests"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#f8f9ff] text-[#0b1c30] text-sm font-semibold transition-colors min-h-[44px]"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#4338ca]" />
                <span>Requests</span>
                {data.pendingReceivedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#ffddb8] text-[#633b00] text-xs font-bold tabular-nums">
                    {data.pendingReceivedCount}
                  </span>
                )}
              </Link>
              <Link
                to="/sessions"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#f8f9ff] text-[#0b1c30] text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Calendar className="w-4 h-4 text-[#4338ca]" />
                <span>Schedule Session</span>
              </Link>
            </div>
          </section>

          {/* Academic Swap Overview 2x2 / 4-col Grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-[#0b1c30]">Academic Swap Overview</h2>
              <span className="text-xs font-medium text-[#64748b]">Live database totals</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Skills I Teach */}
              <Link
                to="/skills"
                className="bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:border-[#c3c4da] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#4338ca] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-display text-2xl font-bold text-[#4338ca] tabular-nums">
                    {data.teachSkills.length}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0b1c30]">Skills I Teach</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {data.teachSkills.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#4338ca] text-[11px] font-semibold truncate max-w-[110px]"
                      >
                        {s.name}
                      </span>
                    ))}
                    {data.teachSkills.length > 2 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#f1f5f9] text-[#464554] text-[11px] font-semibold">
                        +{data.teachSkills.length - 2}
                      </span>
                    )}
                    {data.teachSkills.length === 0 && (
                      <span className="text-xs text-[#64748b]">Add a skill to teach</span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Skills I Seek */}
              <Link
                to="/skills"
                className="bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:border-[#c3c4da] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f5f9] text-[#0b1c30] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-display text-2xl font-bold text-[#0b1c30] tabular-nums">
                    {data.learnSkills.length}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0b1c30]">Skills I Seek</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {data.learnSkills.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#464554] text-[11px] font-semibold truncate max-w-[110px]"
                      >
                        {s.name}
                      </span>
                    ))}
                    {data.learnSkills.length > 2 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#f1f5f9] text-[#464554] text-[11px] font-semibold">
                        +{data.learnSkills.length - 2}
                      </span>
                    )}
                    {data.learnSkills.length === 0 && (
                      <span className="text-xs text-[#64748b]">Add a skill goal</span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Pending Swaps */}
              <Link
                to="/requests"
                className="bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:border-[#c3c4da] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#ffddb8] text-[#633b00] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="font-display text-2xl font-bold text-[#b45309] tabular-nums">
                    {data.pendingReceivedCount + data.pendingSentCount}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0b1c30]">Pending Requests</p>
                  <p className="text-xs text-[#464554] mt-1 tabular-nums">
                    {data.pendingReceivedCount} received · {data.pendingSentCount} sent
                  </p>
                </div>
              </Link>

              {/* Total Points */}
              <Link
                to="/rewards"
                className="bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:border-[#c3c4da] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="font-display text-2xl font-bold text-[#15803d] tabular-nums">
                    {data.user.points}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0b1c30]">Points Earned</p>
                  <p className="text-xs text-[#464554] mt-1 tabular-nums">
                    {data.upcomingSessions.length} upcoming session{data.upcomingSessions.length === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {/* Main 2-column Split: Next Session + Recent Points Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Next Scheduled Session */}
            <section className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-[#0b1c30]">Next Scheduled Session</h2>
                <Link to="/sessions" className="text-xs font-semibold text-[#4338ca] hover:underline">
                  View all ({data.upcomingSessions.length})
                </Link>
              </div>

              {!nextSession ? (
                <div className="rounded-2xl bg-[#f8f9ff] border border-dashed border-[#c3c4da] p-6 text-center">
                  <Calendar className="w-8 h-8 text-[#4338ca] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0b1c30]">No upcoming sessions scheduled</p>
                  <p className="text-xs text-[#464554] mt-1 mb-4">
                    Accept a learning request or schedule with a connected peer to get started.
                  </p>
                  <Link
                    to="/sessions"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4338ca] text-white text-xs font-semibold"
                  >
                    Schedule Session
                  </Link>
                </div>
              ) : (
                (() => {
                  const amTeacher = nextSession.teacher_id === data.user.id;
                  const partnerId = amTeacher ? nextSession.learner_id : nextSession.teacher_id;
                  const partnerName = amTeacher ? nextSession.learner_name : nextSession.teacher_name;
                  const partnerAvatar = amTeacher ? nextSession.learner_avatar : nextSession.teacher_avatar;
                  const partnerMajor = amTeacher ? nextSession.learner_major : nextSession.teacher_major;
                  const partnerYear = amTeacher ? nextSession.learner_year : nextSession.teacher_year;

                  return (
                    <div className="rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={partnerName} src={partnerAvatar} size="md" />
                          <div className="min-w-0">
                            <p className="font-display font-bold text-base text-[#0b1c30] truncate">
                              {nextSession.title}
                            </p>
                            <p className="text-xs text-[#464554] truncate">
                              With <span className="font-semibold text-[#0b1c30]">{partnerName}</span> · {partnerMajor} {partnerYear}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#15803d] text-xs font-semibold shrink-0">
                          Confirmed
                        </span>
                      </div>

                      <div className="rounded-xl bg-white border border-[#e2e8f0] p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#4338ca]">
                            {amTeacher ? 'You teach:' : 'They teach:'}
                          </span>
                          <span className="font-medium text-[#0b1c30]">{nextSession.teach_skill_name}</span>
                        </div>
                        {nextSession.learn_skill_name && (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9]">
                            <span className="font-semibold text-[#b45309]">Exchange skill:</span>
                            <span className="font-medium text-[#0b1c30]">{nextSession.learn_skill_name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#464554]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#4338ca]" />
                          {nextSession.date_str} · {nextSession.time_str}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#4338ca]" />
                          {nextSession.location}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleMessagePartner(partnerId)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#eff4ff] text-[#4338ca] text-sm font-semibold transition-colors"
                        >
                          Prepare Notes
                        </button>
                        <Link
                          to="/sessions"
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold flex items-center justify-center transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })()
              )}
            </section>

            {/* Recent Points & Activity */}
            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-[#0b1c30]">Recent Activity</h2>
                  <Link to="/rewards" className="text-xs font-semibold text-[#4338ca] hover:underline">
                    Leaderboard
                  </Link>
                </div>

                {data.recentActivities.length === 0 ? (
                  <p className="text-xs text-[#64748b] py-6 text-center">
                    Complete your profile or a learning session to earn points.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#f8f9ff] border border-[#f1f5f9]"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <TrendingUp className="w-4 h-4 text-[#15803d] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0b1c30] line-clamp-2">
                              {act.description}
                            </p>
                            <p className="text-[11px] text-[#64748b] mt-0.5">
                              {new Date(act.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#dcfce7] text-[#15803d] text-xs font-bold tabular-nums shrink-0">
                          +{act.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-[#f1f5f9] flex items-center gap-2 text-xs text-[#464554]">
                <ShieldCheck className="w-4 h-4 text-[#4338ca] shrink-0" />
                <span>1-for-1 reciprocal learning. Zero monetary fees.</span>
              </div>
            </section>
          </div>

          {/* Complementary Peer Matches */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0b1c30]">
                  Complementary Peer Matches
                </h2>
                <p className="text-xs text-[#464554]">
                  Transparent rule-based matching comparing skills you teach with what peers seek
                </p>
              </div>
              <Link
                to="/discover"
                className="text-xs font-semibold text-[#4338ca] hover:underline whitespace-nowrap"
              >
                Explore all peers →
              </Link>
            </div>

            {data.recommendedMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 text-center">
                <p className="text-sm text-[#464554]">
                  Add skills you can teach and skills you want to learn to unlock personalized matches.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendedMatches.map((match) => (
                  <div
                    key={match.peer.id}
                    className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col justify-between gap-4 hover:border-[#c3c4da] transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={match.peer.full_name} src={match.peer.avatar_url} size="md" />
                          <div className="min-w-0">
                            <Link
                              to={`/peers/${match.peer.id}`}
                              className="font-display font-bold text-base text-[#0b1c30] hover:text-[#4338ca] truncate block"
                            >
                              {match.peer.full_name}
                            </Link>
                            <p className="text-xs text-[#464554] truncate">
                              {match.peer.major || 'Student'} · {match.peer.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                              match.isMutualMatch
                                ? 'bg-[#ffddb8] text-[#633b00]'
                                : 'bg-[#eff4ff] text-[#4338ca]'
                            }`}
                          >
                            {match.matchPercentage}% {match.isMutualMatch ? 'Mutual Match' : 'Match'}
                          </span>
                          {match.peer.rating_count > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#464554] tabular-nums">
                              <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                              {match.peer.rating_avg.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#464554] line-clamp-2">{match.compatibilityExplanation}</p>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#64748b] w-16 shrink-0">Teaches:</span>
                          {match.teachSkills.slice(0, 3).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#4338ca] font-semibold"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#64748b] w-16 shrink-0">Seeking:</span>
                          {match.learnSkills.slice(0, 3).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#464554] font-semibold"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#f1f5f9]">
                      <Link
                        to={`/peers/${match.peer.id}`}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center justify-center transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => openRequestModal(match)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Request Swap</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Quick Request Swap Modal */}
      {requestPeer && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">
                Propose Skill Swap with {requestPeer.peer.full_name}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setRequestPeer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Skill You Will Teach
                </label>
                <input
                  type="text"
                  required
                  value={reqTeachSkill}
                  onChange={(e) => setReqTeachSkill(e.target.value)}
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
                  value={reqLearnSkill}
                  onChange={(e) => setReqLearnSkill(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Proposed Time
                  </label>
                  <input
                    type="text"
                    required
                    value={reqSlot}
                    onChange={(e) => setReqSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Campus Location
                  </label>
                  <input
                    type="text"
                    required
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Introduction Note
                </label>
                <textarea
                  rows={3}
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestPeer(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-5 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {submittingReq ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
