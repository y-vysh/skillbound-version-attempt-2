import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { BadgeItem, PointsTransaction, UserLevelInfo } from '../types';

interface LeaderboardRow {
  id: number;
  full_name: string;
  major: string;
  year: string;
  location: string;
  avatar_url: string;
  points: number;
  total_sessions: number;
  rating_avg: number;
  rating_count: number;
  rank: number;
  levelInfo: UserLevelInfo;
  isCurrentUser: boolean;
}

interface RewardsPayload {
  user: {
    id: number;
    full_name: string;
    points: number;
    total_sessions: number;
    rating_avg: number;
    rating_count: number;
  };
  levelInfo: UserLevelInfo;
  transactions: PointsTransaction[];
  badges: BadgeItem[];
  leaderboard: LeaderboardRow[];
}

export function RewardsPage() {
  const { showToast } = useAuth();
  const [data, setData] = useState<RewardsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest<RewardsPayload>('/rewards');
        setData(res);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not load rewards.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  return (
    <AppShell>
      {loading || !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-white rounded-2xl border border-[#e2e8f0]" />
          <div className="h-64 bg-white rounded-2xl border border-[#e2e8f0]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Points & Level Hero */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffddb8] text-[#633b00] text-xs font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Level {data.levelInfo.level} · {data.levelInfo.title}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b1c30]">
                  Contribution Points & Badges
                </h1>
                <p className="text-sm text-[#464554]">
                  Earn points by teaching, learning, completing your profile, and receiving positive peer reviews.
                </p>
              </div>

              <div className="px-6 py-4 rounded-2xl bg-[#eff4ff] border border-[#c3c4da] text-center shrink-0">
                <p className="text-xs font-semibold text-[#4338ca] uppercase tracking-wider">
                  Total Points
                </p>
                <p className="font-display text-3xl font-bold text-[#0b1c30] tabular-nums mt-0.5">
                  {data.user.points}
                </p>
                <p className="text-xs text-[#464554] mt-0.5 tabular-nums">
                  {data.user.total_sessions} sessions completed
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#f1f5f9]">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#0b1c30]">Progress to Next Tier</span>
                <span className="text-[#4338ca] tabular-nums">
                  {data.levelInfo.currentPoints} / {data.levelInfo.nextLevelPoints} pts ({data.levelInfo.progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4338ca] transition-all"
                  style={{ width: `${data.levelInfo.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Earning Rules Legend */}
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#4338ca] shrink-0" />
                <div>
                  <p className="font-bold text-[#0b1c30]">+50 pts</p>
                  <p className="text-[#64748b]">Complete learn session</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#4338ca] shrink-0" />
                <div>
                  <p className="font-bold text-[#0b1c30]">+30 pts</p>
                  <p className="text-[#64748b]">Teach a skill session</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center gap-2.5">
                <Star className="w-4 h-4 text-[#f59e0b] shrink-0" />
                <div>
                  <p className="font-bold text-[#0b1c30]">+10 pts</p>
                  <p className="text-[#64748b]">Positive review (4-5★)</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-[#15803d] shrink-0" />
                <div>
                  <p className="font-bold text-[#0b1c30]">+20 pts</p>
                  <p className="text-[#64748b]">Complete profile</p>
                </div>
              </div>
            </div>
          </section>

          {/* Achievement Badges Grid */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0b1c30]">
              Achievement Badges ({data.badges.filter((b) => b.unlocked).length}/{data.badges.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.badges.map((badge) => (
                <div
                  key={badge.key}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    badge.unlocked
                      ? 'bg-[#f8f9ff] border-[#c3c4da]'
                      : 'bg-[#f8fafc] border-[#e2e8f0] opacity-70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      badge.unlocked
                        ? 'bg-[#4338ca] text-white'
                        : 'bg-[#e2e8f0] text-[#64748b]'
                    }`}
                  >
                    {badge.unlocked ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0b1c30]">{badge.name}</p>
                    <p className="text-xs text-[#464554] mt-0.5">{badge.description}</p>
                    {badge.unlocked && badge.unlocked_at && (
                      <p className="text-[11px] font-semibold text-[#15803d] mt-1">
                        Unlocked {new Date(badge.unlocked_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Leaderboard & Contribution History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Campus Leaderboard */}
            <section className="lg:col-span-7 bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0b1c30]">
                  Campus Leaderboard
                </h2>
                <span className="text-xs font-semibold text-[#64748b]">Top Contributors</span>
              </div>

              <div className="space-y-2.5">
                {data.leaderboard.map((row) => (
                  <Link
                    key={row.id}
                    to={row.isCurrentUser ? '/profile' : `/peers/${row.id}`}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                      row.isCurrentUser
                        ? 'bg-[#eff4ff] border-[#4338ca]'
                        : 'bg-[#f8f9ff] border-[#e2e8f0] hover:border-[#c3c4da]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums shrink-0 ${
                          row.rank <= 3
                            ? 'bg-[#ffddb8] text-[#633b00]'
                            : 'bg-white border border-[#e2e8f0] text-[#464554]'
                        }`}
                      >
                        #{row.rank}
                      </span>
                      <Avatar name={row.full_name} src={row.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0b1c30] truncate">
                          {row.full_name} {row.isCurrentUser ? '(You)' : ''}
                        </p>
                        <p className="text-[11px] text-[#64748b] truncate">
                          {row.major} · {row.total_sessions} swaps · Lvl {row.levelInfo.level}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#4338ca] tabular-nums shrink-0">
                      {row.points} pts
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Contribution History */}
            <section className="lg:col-span-5 bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0b1c30]">
                  Points Ledger
                </h2>
                <Award className="w-5 h-5 text-[#4338ca]" />
              </div>

              {data.transactions.length === 0 ? (
                <p className="text-xs text-[#64748b] py-8 text-center">
                  No point transactions yet. Complete a learning session or profile to earn points!
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {data.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <TrendingUp className="w-4 h-4 text-[#15803d] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0b1c30]">{tx.description}</p>
                          <p className="text-[11px] text-[#64748b] mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#dcfce7] text-[#15803d] text-xs font-bold tabular-nums shrink-0">
                        +{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
