import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { AcceptedConnection, LearningSession } from '../types';

export function SessionsPage() {
  const { user, showToast, refreshMe } = useAuth();

  const [tab, setTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [connections, setConnections] = useState<AcceptedConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule New Session Modal
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [teachSkillName, setTeachSkillName] = useState('');
  const [learnSkillName, setLearnSkillName] = useState('');
  const [dateStr, setDateStr] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [timeStr, setTimeStr] = useState('3:30 PM - 4:30 PM');
  const [location, setLocation] = useState('Butler Library, Room 302');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Details / Reschedule / Cancel Modals
  const [detailSession, setDetailSession] = useState<LearningSession | null>(null);
  const [rescheduleSession, setRescheduleSession] = useState<LearningSession | null>(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resLoc, setResLoc] = useState('');
  const [cancelTarget, setCancelTarget] = useState<LearningSession | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        sessions: LearningSession[];
        acceptedConnections: AcceptedConnection[];
      }>('/sessions');
      setSessions(res.sessions);
      setConnections(res.acceptedConnections);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load sessions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectConnection = (reqIdStr: string) => {
    setSelectedReqId(reqIdStr);
    const conn = connections.find((c) => String(c.request_id) === reqIdStr);
    if (conn) {
      setTitle(`${conn.learn_skill_name} & ${conn.teach_skill_name} Session`);
      setTeachSkillName(conn.teach_skill_name);
      setLearnSkillName(conn.learn_skill_name);
      setLocation(conn.proposed_location || 'Campus Library');
    }
  };

  const openScheduleNew = () => {
    if (connections.length > 0) {
      const first = connections[0];
      setSelectedReqId(String(first.request_id));
      setTitle(`${first.learn_skill_name} & ${first.teach_skill_name} Session`);
      setTeachSkillName(first.teach_skill_name);
      setLearnSkillName(first.learn_skill_name);
      setLocation(first.proposed_location || 'Butler Library, Room 302');
    } else {
      setSelectedReqId('');
    }
    setScheduleOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId) {
      showToast('Select an accepted connection first.', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          requestId: Number(selectedReqId),
          title,
          teachSkillName,
          learnSkillName,
          dateStr,
          timeStr,
          location,
          description,
        }),
      });
      showToast('Session scheduled!', 'success');
      setScheduleOpen(false);
      await loadSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not schedule session.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (session: LearningSession) => {
    try {
      await apiRequest(`/sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' }),
      });
      showToast('Session marked completed! Points awarded.', 'success');
      await loadSessions();
      await refreshMe();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to complete session.', 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await apiRequest(`/sessions/${cancelTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      showToast('Session cancelled.', 'info');
      setCancelTarget(null);
      await loadSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel session.', 'error');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleSession) return;
    setSaving(true);
    try {
      await apiRequest(`/sessions/${rescheduleSession.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          dateStr: resDate,
          timeStr: resTime,
          location: resLoc,
        }),
      });
      showToast('Session rescheduled.', 'success');
      setRescheduleSession(null);
      await loadSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not reschedule.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = sessions.filter((s) => s.status === tab);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#0b1c30]">Learning Sessions</h1>
              <p className="text-sm text-[#464554] mt-1">
                Manage upcoming 1-on-1 swaps, mark sessions complete to earn points, and share peer feedback.
              </p>
            </div>
            <button
              type="button"
              onClick={openScheduleNew}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Session</span>
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 border-b border-[#e2e8f0] overflow-x-auto">
            {(['Upcoming', 'Completed', 'Cancelled'] as const).map((statusTab) => {
              const count = sessions.filter((s) => s.status === statusTab).length;
              return (
                <button
                  key={statusTab}
                  type="button"
                  onClick={() => setTab(statusTab)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    tab === statusTab
                      ? 'border-[#4338ca] text-[#4338ca]'
                      : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
                  }`}
                >
                  {statusTab} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-[#e2e8f0]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
            <Calendar className="w-9 h-9 text-[#4338ca] mx-auto mb-3" />
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              No {tab.toLowerCase()} sessions
            </h2>
            <p className="text-sm text-[#464554] mt-1 mb-4">
              {connections.length > 0
                ? 'Schedule a session with one of your accepted skill exchange partners.'
                : 'Accept a learning request first to schedule a 1-on-1 session.'}
            </p>
            {connections.length > 0 ? (
              <button
                type="button"
                onClick={openScheduleNew}
                className="px-4 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
              >
                Schedule Session
              </button>
            ) : (
              <Link
                to="/requests"
                className="px-4 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold inline-block"
              >
                View Learning Requests
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((sess) => {
              const amTeacher = user?.id === sess.teacher_id;
              const partnerName = amTeacher ? sess.learner_name : sess.teacher_name;
              const partnerAvatar = amTeacher ? sess.learner_avatar : sess.teacher_avatar;
              const partnerMajor = amTeacher ? sess.learner_major : sess.teacher_major;
              const partnerId = amTeacher ? sess.learner_id : sess.teacher_id;

              return (
                <article
                  key={sess.id}
                  className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar name={partnerName} src={partnerAvatar} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-lg text-[#0b1c30] truncate">
                          {sess.title}
                        </h3>
                        <p className="text-xs text-[#464554]">
                          With{' '}
                          <Link
                            to={`/peers/${partnerId}`}
                            className="font-semibold text-[#4338ca] hover:underline"
                          >
                            {partnerName}
                          </Link>{' '}
                          · {partnerMajor} ·{' '}
                          <span className="font-semibold">
                            {amTeacher ? 'You are Teacher' : 'You are Learner'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                        sess.status === 'Upcoming'
                          ? 'bg-[#eff4ff] text-[#4338ca]'
                          : sess.status === 'Completed'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#f1f5f9] text-[#464554]'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-[#eff4ff] text-[#4338ca] font-semibold">
                      Teach: {sess.teach_skill_name}
                    </span>
                    {sess.learn_skill_name && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#ffddb8] text-[#633b00] font-semibold">
                        Swap: {sess.learn_skill_name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#464554]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#4338ca]" />
                      {sess.date_str} · {sess.time_str}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#4338ca]" />
                      {sess.location}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
                    <button
                      type="button"
                      onClick={() => setDetailSession(sess)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#e2e8f0] text-[#0b1c30] hover:bg-[#f8f9ff] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>

                    {sess.status === 'Upcoming' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleSession(sess);
                            setResDate(sess.date_str);
                            setResTime(sess.time_str);
                            setResLoc(sess.location);
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#e2e8f0] text-[#4338ca] hover:bg-[#eff4ff] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelTarget(sess)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#fca5a5] text-[#ba1a1a] hover:bg-[#ffdad6]/40 text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(sess)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Completed</span>
                        </button>
                      </>
                    )}

                    {sess.status === 'Completed' && !sess.has_reviewed && (
                      <Link
                        to={`/feedback/${sess.id}`}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Star className="w-4 h-4" />
                        <span>Leave Review (+10 pts)</span>
                      </Link>
                    )}

                    {sess.status === 'Completed' && Boolean(sess.has_reviewed) && (
                      <span className="px-3 py-2 rounded-xl bg-[#f1f5f9] text-[#464554] text-xs font-semibold">
                        Reviewed
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Session Modal */}
      {scheduleOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">Schedule Learning Session</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setScheduleOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {connections.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#464554] mb-4">
                  You need an accepted learning request before scheduling a session.
                </p>
                <Link
                  to="/discover"
                  onClick={() => setScheduleOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold inline-block"
                >
                  Discover Peers
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Accepted Swap Partner
                  </label>
                  <select
                    value={selectedReqId}
                    onChange={(e) => handleSelectConnection(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4338ca]"
                  >
                    {connections.map((c) => (
                      <option key={c.request_id} value={c.request_id}>
                        {c.peer_name} ({c.learn_skill_name} / {c.teach_skill_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Session Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Time</label>
                    <input
                      type="text"
                      required
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Schedule'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {detailSession && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">{detailSession.title}</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDetailSession(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-[#464554]">
              <p>
                <strong className="text-[#0b1c30]">Teacher:</strong> {detailSession.teacher_name}
              </p>
              <p>
                <strong className="text-[#0b1c30]">Learner:</strong> {detailSession.learner_name}
              </p>
              <p>
                <strong className="text-[#0b1c30]">Schedule:</strong> {detailSession.date_str} ·{' '}
                {detailSession.time_str}
              </p>
              <p>
                <strong className="text-[#0b1c30]">Location:</strong> {detailSession.location}
              </p>
              {detailSession.description && (
                <p className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs">
                  {detailSession.description}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailSession(null)}
                className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleSession && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="font-display font-bold text-lg text-[#0b1c30] mb-4">
              Reschedule "{rescheduleSession.title}"
            </h3>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">New Time</label>
                <input
                  type="text"
                  required
                  value={resTime}
                  onChange={(e) => setResTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={resLoc}
                  onChange={(e) => setResLoc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleSession(null)}
                  className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Session Confirm */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Learning Session?"
        description={`Are you sure you want to cancel "${cancelTarget?.title}"? Your learning partner will be notified.`}
        confirmLabel="Cancel Session"
        destructive
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />
    </AppShell>
  );
}
