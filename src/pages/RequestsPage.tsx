import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Calendar,
  Check,
  Clock,
  MapPin,
  MessageSquare,
  Star,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { LearningRequest } from '../types';

const STATUS_BADGE: Record<LearningRequest['status'], string> = {
  Pending: 'bg-[#ffddb8] text-[#633b00]',
  Accepted: 'bg-[#dcfce7] text-[#15803d]',
  Rejected: 'bg-[#ffdad6] text-[#ba1a1a]',
  Cancelled: 'bg-[#f1f5f9] text-[#464554]',
  Completed: 'bg-[#eff4ff] text-[#4338ca]',
};

export function RequestsPage() {
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<LearningRequest[]>([]);
  const [sent, setSent] = useState<LearningRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmAction, setConfirmAction] = useState<{
    req: LearningRequest;
    nextStatus: 'Rejected' | 'Cancelled';
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Schedule Session Modal for Accepted Request
  const [scheduleReq, setScheduleReq] = useState<LearningRequest | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('4:00 PM - 5:00 PM');
  const [location, setLocation] = useState('Butler Library, Room 302');
  const [description, setDescription] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ received: LearningRequest[]; sent: LearningRequest[] }>('/requests');
      setReceived(res.received);
      setSent(res.sent);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (reqId: number, status: 'Accepted' | 'Rejected' | 'Cancelled') => {
    setProcessingId(reqId);
    try {
      await apiRequest(`/requests/${reqId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Request ${status.toLowerCase()}.`, status === 'Accepted' ? 'success' : 'info');
      setConfirmAction(null);
      await loadRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMessagePeer = async (peerId: number) => {
    try {
      const res = await apiRequest<{ conversation: { id: number } }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ peerId }),
      });
      navigate(`/messages?conv=${res.conversation.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open chat.', 'error');
    }
  };

  const openScheduleModal = (req: LearningRequest) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setScheduleReq(req);
    setSessionTitle(`${req.learn_skill_name} & ${req.teach_skill_name} Swap`);
    setDateStr(tomorrow);
    setTimeStr('4:00 PM - 5:00 PM');
    setLocation(req.proposed_location || 'Butler Library, Room 302');
    setDescription(`1-on-1 peer session covering ${req.learn_skill_name} and ${req.teach_skill_name}.`);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleReq) return;
    setScheduling(true);
    try {
      await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          requestId: scheduleReq.id,
          title: sessionTitle,
          dateStr,
          timeStr,
          location,
          description,
        }),
      });
      showToast('Learning session scheduled!', 'success');
      setScheduleReq(null);
      navigate('/sessions');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not schedule session.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const activeList = tab === 'received' ? received : sent;
  const pendingReceivedCount = received.filter((r) => r.status === 'Pending').length;
  const pendingSentCount = sent.filter((r) => r.status === 'Pending').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#0b1c30]">Learning Requests</h1>
              <p className="text-sm text-[#464554] mt-1">
                Review incoming swap proposals, manage sent invitations, and schedule accepted exchanges.
              </p>
            </div>
            <Link
              to="/discover"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Find New Peers</span>
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-2 border-b border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setTab('received')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                tab === 'received'
                  ? 'border-[#4338ca] text-[#4338ca]'
                  : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
              }`}
            >
              <span>Received Requests ({received.length})</span>
              {pendingReceivedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#ffddb8] text-[#633b00] text-xs font-bold tabular-nums">
                  {pendingReceivedCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('sent')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                tab === 'sent'
                  ? 'border-[#4338ca] text-[#4338ca]'
                  : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
              }`}
            >
              <span>Sent Requests ({sent.length})</span>
              {pendingSentCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#eff4ff] text-[#4338ca] text-xs font-bold tabular-nums">
                  {pendingSentCount}
                </span>
              )}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-white rounded-2xl border border-[#e2e8f0]" />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
            <ArrowLeftRight className="w-9 h-9 text-[#4338ca] mx-auto mb-3" />
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              {tab === 'received' ? 'No received requests yet' : 'No sent requests yet'}
            </h2>
            <p className="text-sm text-[#464554] mt-1 mb-4">
              {tab === 'received'
                ? 'Keep your teachable skills updated so peers can invite you to swap.'
                : 'Browse Discover to propose a 1-on-1 skill swap with a compatible student.'}
            </p>
            <Link
              to="/discover"
              className="px-4 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold inline-block"
            >
              Browse Skill Directory
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeList.map((req) => {
              const peerId = tab === 'received' ? req.sender_id : req.receiver_id;
              return (
                <article
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={req.peer_name} src={req.peer_avatar} size="md" />
                      <div className="min-w-0">
                        <Link
                          to={`/peers/${peerId}`}
                          className="font-display font-bold text-base text-[#0b1c30] hover:text-[#4338ca] truncate block"
                        >
                          {req.peer_name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                          <span>
                            {req.peer_major} · {req.peer_year}
                          </span>
                          {req.peer_rating > 0 && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0b1c30] tabular-nums">
                              <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                              {req.peer_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-center ${
                        STATUS_BADGE[req.status]
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Skill Exchange Pair */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs">
                    <div>
                      <span className="text-[#64748b] font-semibold block">
                        {tab === 'received' ? 'They offer to teach:' : 'You offer to teach:'}
                      </span>
                      <span className="font-bold text-[#4338ca] text-sm mt-0.5 block">
                        {req.teach_skill_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748b] font-semibold block">
                        {tab === 'received' ? 'They want to learn from you:' : 'You want to learn:'}
                      </span>
                      <span className="font-bold text-[#0b1c30] text-sm mt-0.5 block">
                        {req.learn_skill_name}
                      </span>
                    </div>
                  </div>

                  {req.message && (
                    <p className="text-sm text-[#464554] bg-[#f8f9ff] px-4 py-3 rounded-xl border border-[#f1f5f9]">
                      "{req.message}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#4338ca]" />
                        {req.proposed_slot}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#4338ca]" />
                        {req.proposed_location}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMessagePeer(peerId)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#eff4ff] text-[#4338ca] text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Message</span>
                      </button>

                      {tab === 'received' && req.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => setConfirmAction({ req, nextStatus: 'Rejected' })}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#fca5a5] bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleStatusChange(req.id, 'Accepted')}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Swap</span>
                          </button>
                        </>
                      )}

                      {tab === 'sent' && req.status === 'Pending' && (
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => setConfirmAction({ req, nextStatus: 'Cancelled' })}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#e2e8f0] hover:bg-[#ffdad6]/40 hover:text-[#ba1a1a] text-[#464554] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel Request</span>
                        </button>
                      )}

                      {req.status === 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => openScheduleModal(req)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Schedule Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Decline / Cancel */}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.nextStatus === 'Rejected' ? 'Decline Request?' : 'Cancel Pending Request?'}
        description={
          confirmAction?.nextStatus === 'Rejected'
            ? `Decline the learning request from ${confirmAction?.req.peer_name}?`
            : `Cancel your pending learning request to ${confirmAction?.req.peer_name}?`
        }
        confirmLabel={confirmAction?.nextStatus === 'Rejected' ? 'Decline' : 'Cancel Request'}
        destructive
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            handleStatusChange(confirmAction.req.id, confirmAction.nextStatus);
          }
        }}
      />

      {/* Schedule Session Modal */}
      {scheduleReq && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">
                Schedule Session with {scheduleReq.peer_name}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setScheduleReq(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
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
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Session Agenda
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleReq(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
