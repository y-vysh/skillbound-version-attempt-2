import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Compass,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { SKILL_CATEGORIES, type PeerMatch } from '../types';

export function DiscoverPage() {
  const { user, teachSkills: myTeachSkills, showToast } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [mutualOnly, setMutualOnly] = useState(false);

  const [matches, setMatches] = useState<PeerMatch[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState<PeerMatch | null>(null);
  const [teachSkillName, setTeachSkillName] = useState('');
  const [learnSkillName, setLearnSkillName] = useState('');
  const [proposedSlot, setProposedSlot] = useState('Thu 4:00 PM - 5:00 PM');
  const [proposedLocation, setProposedLocation] = useState('Butler Library');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchPeers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'All') params.set('category', category);
      if (level !== 'All') params.set('level', level);
      if (locationFilter !== 'All') params.set('location', locationFilter);
      if (mutualOnly) params.set('mutualOnly', 'true');

      const res = await apiRequest<{
        matches: PeerMatch[];
        locations: string[];
      }>(`/discover?${params.toString()}`);

      setMatches(res.matches);
      setLocations(res.locations);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load skill discovery.', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, category, level, locationFilter, mutualOnly, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchPeers();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [fetchPeers]);

  const openSwapModal = (match: PeerMatch) => {
    if (!user) {
      showToast('Please log in to send a learning request.', 'info');
      navigate('/login');
      return;
    }
    setSelectedMatch(match);
    setTeachSkillName(match.youTeachTheyWant[0] || myTeachSkills[0]?.name || 'Peer Mentoring');
    setLearnSkillName(match.theyTeachYouCanLearn[0] || match.teachSkills[0]?.name || '');
    setProposedSlot('This Friday 2:00 PM - 3:00 PM');
    setProposedLocation(match.peer.location || 'Campus Library');
    setMessage(
      `Hi ${match.peer.full_name.split(' ')[0]}! I saw your profile on SkillBound and would love to swap skills.`
    );
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setSending(true);
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: selectedMatch.peer.id,
          teachSkillName,
          learnSkillName,
          proposedSlot,
          proposedLocation,
          message,
        }),
      });
      showToast(`Request sent to ${selectedMatch.peer.full_name}!`, 'success');
      setSelectedMatch(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send request.', 'error');
    } finally {
      setSending(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338ca] mb-1">
              <Compass className="w-4 h-4" />
              <span>Peer Skill Directory & Smart Matching</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0b1c30]">
              Discover Complementary Peers
            </h1>
            <p className="text-sm text-[#464554] mt-1">
              Browse verified students across 10 disciplines and filter by skill category, level, or mutual swap compatibility.
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => setMutualOnly((prev) => !prev)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors border shrink-0 ${
                mutualOnly
                  ? 'bg-[#4338ca] text-white border-[#4338ca]'
                  : 'bg-[#eff4ff] text-[#4338ca] border-[#c3c4da] hover:bg-[#e0e0ff]'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{mutualOnly ? 'Showing Mutual Matches Only' : 'Mutual Match Only'}</span>
            </button>
          )}
        </div>

        {/* Search + Filter Controls */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills (e.g., Python, Photography, Figma, Guitar)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-sm focus:bg-white focus:outline-none focus:border-[#4338ca]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by Experience Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-sm focus:bg-white focus:outline-none focus:border-[#4338ca]"
            >
              <option value="All">All Experience Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-sm focus:bg-white focus:outline-none focus:border-[#4338ca]"
            >
              <option value="All">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 10 Category Filter Chips */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-[#64748b] shrink-0" />
          {['All', ...SKILL_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-[#4338ca] text-white'
                  : 'bg-[#f1f5f9] text-[#464554] hover:bg-[#eff4ff] hover:text-[#4338ca]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#464554]">
        <span className="font-semibold tabular-nums">
          {loading ? 'Searching campus peers...' : `${matches.length} peer${matches.length === 1 ? '' : 's'} found`}
        </span>
        {(query || category !== 'All' || level !== 'All' || locationFilter !== 'All' || mutualOnly) && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
              setLevel('All');
              setLocationFilter('All');
              setMutualOnly(false);
            }}
            className="font-semibold text-[#4338ca] hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-[#e2e8f0]" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <Sparkles className="w-9 h-9 text-[#4338ca] mx-auto mb-3" />
          <h2 className="font-display font-bold text-lg text-[#0b1c30]">No peers match these filters</h2>
          <p className="text-sm text-[#464554] mt-1 mb-4">
            Try clearing one of your active filters or searching a broader skill keyword.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
              setLevel('All');
              setLocationFilter('All');
              setMutualOnly(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
          >
            Show All Peers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <article
              key={match.peer.id}
              className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col justify-between gap-4 hover:border-[#c3c4da] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
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
                        {match.peer.major || 'Student'} · {match.peer.year || 'Peer'}
                      </p>
                    </div>
                  </div>
                  {user && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums shrink-0 ${
                        match.isMutualMatch
                          ? 'bg-[#ffddb8] text-[#633b00]'
                          : 'bg-[#eff4ff] text-[#4338ca]'
                      }`}
                    >
                      {match.matchPercentage}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#64748b]">
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#4338ca] shrink-0" />
                    {match.peer.location}
                  </span>
                  {match.peer.rating_count > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#0b1c30] tabular-nums shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                      {match.peer.rating_avg.toFixed(1)} ({match.peer.rating_count})
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#464554] line-clamp-2">
                  {user ? match.compatibilityExplanation : match.peer.bio || 'Verified SkillBound campus peer.'}
                </p>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="font-semibold text-[#64748b] block mb-1">Can Teach</span>
                    <div className="flex flex-wrap gap-1.5">
                      {match.teachSkills.map((sk) => (
                        <span
                          key={sk.id}
                          className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#4338ca] font-semibold"
                        >
                          {sk.name} · {sk.proficiency}
                        </span>
                      ))}
                      {match.teachSkills.length === 0 && (
                        <span className="text-[#64748b]">No skills listed yet</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-[#64748b] block mb-1">Wants to Learn</span>
                    <div className="flex flex-wrap gap-1.5">
                      {match.learnSkills.map((sk) => (
                        <span
                          key={sk.id}
                          className="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#464554] font-semibold"
                        >
                          {sk.name}
                        </span>
                      ))}
                      {match.learnSkills.length === 0 && (
                        <span className="text-[#64748b]">Open to suggestions</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#f1f5f9]">
                <Link
                  to={`/peers/${match.peer.id}`}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  View Profile
                </Link>
                <button
                  type="button"
                  onClick={() => openSwapModal(match)}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Connect</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Connect / Request Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">
                Connect with {selectedMatch.peer.full_name}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedMatch(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Skill You Offer to Teach
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
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send Learning Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (user) {
    return <AppShell>{content}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/Image_2_5cee0444.jpeg"
            alt="SkillBound Logo"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-display font-bold text-lg text-[#4338ca]">SkillBound</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-[#4338ca] hover:underline">
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-sm font-semibold"
          >
            Join Network
          </Link>
        </div>
      </header>
      <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6">{content}</main>
    </div>
  );
}
