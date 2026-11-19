import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { LearningSession } from '../types';

const IMPRESSION_TAGS = [
  'Clear Explanations',
  'Patient Mentor',
  'Well Prepared',
  'Hands-on Examples',
  'Great Energy',
  'Punctual',
];

export function FeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, showToast, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Clear Explanations']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ sessions: LearningSession[] }>('/sessions');
        const found = res.sessions.find((s) => String(s.id) === String(sessionId));
        if (!found) {
          setError('Session not found.');
        } else {
          setSession(found);
          if (found.has_reviewed) {
            setSubmitted(true);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load session.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 6)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          rating,
          tags: selectedTags,
          comment,
        }),
      });
      setSubmitted(true);
      showToast('Review submitted! Thank you for supporting your peer.', 'success');
      await refreshMe();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const amTeacher = user?.id === session?.teacher_id;
  const partnerName = session ? (amTeacher ? session.learner_name : session.teacher_name) : '';
  const partnerAvatar = session ? (amTeacher ? session.learner_avatar : session.teacher_avatar) : '';

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/sessions')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4338ca] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sessions</span>
        </button>

        {loading ? (
          <div className="h-72 bg-white rounded-2xl border border-[#e2e8f0] animate-pulse" />
        ) : error && !session ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
            <p className="text-sm font-semibold text-[#ba1a1a] mb-4">{error}</p>
            <Link to="/sessions" className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold">
              Return to Sessions
            </Link>
          </div>
        ) : submitted ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0b1c30]">Review Recorded</h1>
            <p className="text-sm text-[#464554]">
              Your feedback for <strong>{partnerName}</strong> ({session?.title}) has been saved to their verified campus profile.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/sessions"
                className="px-5 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
              >
                Back to Sessions
              </Link>
              <Link
                to="/rewards"
                className="px-5 py-2.5 rounded-xl bg-[#eff4ff] text-[#4338ca] text-sm font-semibold"
              >
                View Points
              </Link>
            </div>
          </div>
        ) : session ? (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-[#f1f5f9]">
              <Avatar name={partnerName} src={partnerAvatar} size="lg" />
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0b1c30]">
                  Rate Your Session with {partnerName}
                </h1>
                <p className="text-sm text-[#464554] mt-0.5">
                  {session.title} · {session.date_str}
                </p>
              </div>
            </div>

            {session.status !== 'Completed' && (
              <div className="p-4 rounded-xl bg-[#ffddb8]/50 border border-[#fcd34d] text-xs font-semibold text-[#633b00]">
                Note: This session is currently marked "{session.status}". Mark it completed on the Sessions page before submitting a review.
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1-5 Star Selector */}
              <div>
                <label className="block text-sm font-bold text-[#0b1c30] mb-2">
                  Overall Experience ({rating}/5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      onClick={() => setRating(star)}
                      className="w-11 h-11 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-center hover:border-[#4338ca] transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#cbd5e1]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Impression Tags */}
              <div>
                <label className="block text-sm font-bold text-[#0b1c30] mb-2">
                  Session Highlights
                </label>
                <div className="flex flex-wrap gap-2">
                  {IMPRESSION_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-[#4338ca] text-white border-[#4338ca]'
                            : 'bg-[#f8f9ff] text-[#464554] border-[#e2e8f0] hover:border-[#4338ca]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-[#0b1c30]">Written Review</label>
                  <span className="text-xs text-[#64748b] tabular-nums">{comment.length}/300</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={300}
                  required
                  placeholder="Share what went well during your skill exchange..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || session.status !== 'Completed'}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting Review...' : 'Submit Peer Review'}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
