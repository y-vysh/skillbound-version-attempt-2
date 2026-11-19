import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface AdminUserRow {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'admin';
  major: string;
  year: string;
  location: string;
  points: number;
  total_sessions: number;
  rating_avg: number;
  is_active: number;
  is_reported: number;
  report_reason: string;
  created_at: string;
}

interface AdminOverview {
  stats: {
    totalUsers: number;
    totalSessions: number;
    completedSessions: number;
    totalRequests: number;
    reportedUsersCount: number;
    totalSkills: number;
  };
  users: AdminUserRow[];
  recentSessions: Array<{
    id: number;
    title: string;
    status: string;
    date_str: string;
    location: string;
    teacher_name: string;
    learner_name: string;
  }>;
  recentRequests: Array<{
    id: number;
    teach_skill_name: string;
    learn_skill_name: string;
    status: string;
    sender_name: string;
    receiver_name: string;
  }>;
}

export function AdminPage() {
  const { showToast } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AdminOverview>('/admin/overview');
      setData(res);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load admin overview.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleAction = async (userId: number, action: 'suspend' | 'activate' | 'clear_report') => {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      showToast(`User ${action.replace('_', ' ')} completed.`, 'success');
      await loadOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      showToast(`Removed ${deleteTarget.full_name}.`, 'info');
      setDeleteTarget(null);
      await loadOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete user.', 'error');
    }
  };

  const filteredUsers =
    data?.users.filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.major.toLowerCase().includes(q)
      );
    }) || [];

  const reportedUsers = data?.users.filter((u) => u.is_reported === 1) || [];

  return (
    <AppShell>
      {loading || !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-[#e2e8f0]" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-2xl border border-[#e2e8f0]" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4338ca] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Role-Protected Campus Moderation</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0b1c30]">Admin Overview</h1>
            <p className="text-sm text-[#464554] mt-1">
              Monitor active students, review safety reports, and track platform skill-swap activity.
            </p>
          </section>

          {/* 4 KPI Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">Registered Students</span>
                <Users className="w-4 h-4 text-[#4338ca]" />
              </div>
              <p className="font-display text-2xl font-bold text-[#0b1c30] tabular-nums mt-2">
                {data.stats.totalUsers}
              </p>
              <p className="text-[11px] text-[#64748b] mt-1 tabular-nums">
                {data.stats.totalSkills} skills indexed
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">Total Sessions</span>
                <Calendar className="w-4 h-4 text-[#4338ca]" />
              </div>
              <p className="font-display text-2xl font-bold text-[#0b1c30] tabular-nums mt-2">
                {data.stats.totalSessions}
              </p>
              <p className="text-[11px] text-[#15803d] font-semibold mt-1 tabular-nums">
                {data.stats.completedSessions} completed
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">Swap Requests</span>
                <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
              </div>
              <p className="font-display text-2xl font-bold text-[#0b1c30] tabular-nums mt-2">
                {data.stats.totalRequests}
              </p>
              <p className="text-[11px] text-[#64748b] mt-1">All-time requests</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">Reported Users</span>
                <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
              </div>
              <p className="font-display text-2xl font-bold text-[#ba1a1a] tabular-nums mt-2">
                {data.stats.reportedUsersCount}
              </p>
              <p className="text-[11px] text-[#64748b] mt-1">Requires moderator review</p>
            </div>
          </section>

          {/* Reported Users Alert Section */}
          {reportedUsers.length > 0 && (
            <section className="bg-[#ffdad6]/35 rounded-2xl border border-[#fca5a5] p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#ba1a1a] font-display font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Flagged Accounts ({reportedUsers.length})</span>
              </div>
              <div className="space-y-2.5">
                {reportedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white rounded-xl border border-[#fca5a5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#0b1c30]">
                        {u.full_name} ({u.email})
                      </p>
                      <p className="text-xs text-[#ba1a1a] mt-0.5">Reason: {u.report_reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(u.id, 'clear_report')}
                        className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                      >
                        Clear Report
                      </button>
                      {u.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleAction(u.id, 'suspend')}
                          className="px-3 py-1.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-semibold"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAction(u.id, 'activate')}
                          className="px-3 py-1.5 rounded-lg bg-[#15803d] text-white text-xs font-semibold"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* User Directory Table */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-[#0b1c30]">User Directory</h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, email, major..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-xs focus:bg-white focus:outline-none focus:border-[#4338ca]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[#64748b]">
                    <th className="py-2.5 pr-4 font-semibold">User</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold">Points / Swaps</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 pl-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f8f9ff]">
                      <td className="py-3 pr-4">
                        <p className="font-bold text-[#0b1c30]">{u.full_name}</p>
                        <p className="text-[#64748b]">{u.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold ${
                            u.role === 'admin'
                              ? 'bg-[#eff4ff] text-[#4338ca]'
                              : 'bg-[#f1f5f9] text-[#464554]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {u.points} pts · {u.total_sessions} swaps
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold ${
                            u.is_active
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : 'bg-[#ffdad6] text-[#ba1a1a]'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {u.role !== 'admin' && (
                          <div className="inline-flex items-center gap-2">
                            {u.is_active ? (
                              <button
                                type="button"
                                onClick={() => handleAction(u.id, 'suspend')}
                                className="px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-[#464554] hover:text-[#ba1a1a] font-semibold"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAction(u.id, 'activate')}
                                className="px-2.5 py-1 rounded-lg bg-[#15803d] text-white font-semibold"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`Delete ${u.full_name}`}
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Platform Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 space-y-3">
              <h2 className="font-display font-bold text-base text-[#0b1c30]">Recent Sessions</h2>
              <div className="space-y-2 text-xs">
                {data.recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#0b1c30] truncate">{s.title}</p>
                      <p className="text-[#64748b] truncate">
                        {s.teacher_name} ↔ {s.learner_name} · {s.date_str}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e2e8f0] font-semibold shrink-0">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 space-y-3">
              <h2 className="font-display font-bold text-base text-[#0b1c30]">Recent Requests</h2>
              <div className="space-y-2 text-xs">
                {data.recentRequests.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#0b1c30] truncate">
                        {r.sender_name} → {r.receiver_name}
                      </p>
                      <p className="text-[#64748b] truncate">
                        Offers {r.teach_skill_name} for {r.learn_skill_name}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#e2e8f0] font-semibold shrink-0">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User Account?"
        description={`Permanently delete ${deleteTarget?.full_name} and all their associated skills, requests, and sessions?`}
        confirmLabel="Delete Account"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
      />
    </AppShell>
  );
}
