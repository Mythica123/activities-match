'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Filter, X, MapPin, Calendar, Users, Heart, XCircle } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'swipe' | 'list';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  scheduled_at: string;
  location: string;
  image_url: string | null;
  max_participants: number;
  current_participants: number;
  genders: string[] | null;
  age_min: number | null;
  age_max: number | null;
  distance_miles: number | null;
}

interface Filters {
  ageMin: string;
  ageMax: string;
  distanceMax: string;
  genders: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  sports:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  arts:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  outdoor:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  social:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  gaming:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  fitness:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  education: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Swipe Card ────────────────────────────────────────────────────────────────
function SwipeCard({
  activity,
  onAccept,
  onReject,
  isTop,
}: {
  activity: Activity;
  onAccept: () => void;
  onReject: () => void;
  isTop: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 100;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTop) return;
    setDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const x = e.clientX - startPos.current.x;
    const y = e.clientY - startPos.current.y;
    setOffset({ x, y });
    if (x > 40) setDecision('accept');
    else if (x < -40) setDecision('reject');
    else setDecision(null);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (offset.x > THRESHOLD) {
      onAccept();
    } else if (offset.x < -THRESHOLD) {
      onReject();
    } else {
      setOffset({ x: 0, y: 0 });
      setDecision(null);
    }
  };

  const rotate = offset.x / 20;
  const opacity = Math.max(0, 1 - Math.abs(offset.x) / 400);

  const spotsLeft = activity.max_participants - activity.current_participants;

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotate}deg)`,
        transition: dragging ? 'none' : 'transform 0.3s ease',
        cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
        zIndex: isTop ? 10 : 5,
        opacity: isTop ? 1 : 0.85,
        scale: isTop ? '1' : '0.96',
      }}
      className="absolute inset-0 select-none"
    >
      <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Image or gradient header */}
        <div className="relative h-52 flex-shrink-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
          {activity.image_url ? (
            <img src={activity.image_url} alt={activity.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">
                {activity.category === 'sports' ? '🏃' :
                 activity.category === 'gaming' ? '🎮' :
                 activity.category === 'outdoor' ? '🌿' :
                 activity.category === 'arts' ? '🎨' :
                 activity.category === 'fitness' ? '💪' :
                 activity.category === 'social' ? '🤝' :
                 activity.category === 'education' ? '📚' : '✨'}
              </span>
            </div>
          )}

          {/* Swipe indicators */}
          {decision === 'accept' && (
            <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center rounded-t-2xl">
              <div className="bg-green-500 text-white font-bold text-2xl px-6 py-2 rounded-full rotate-[-15deg] border-4 border-white">
                JOIN
              </div>
            </div>
          )}
          {decision === 'reject' && (
            <div className="absolute inset-0 bg-red-400/20 flex items-center justify-center rounded-t-2xl">
              <div className="bg-red-500 text-white font-bold text-2xl px-6 py-2 rounded-full rotate-[15deg] border-4 border-white">
                SKIP
              </div>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${categoryColor(activity.category)}`}>
              {activity.category}
            </span>
          </div>

          {/* Spots badge */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" />
            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </div>
        </div>

        {/* Card body */}
        <div className="flex-1 p-5 flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold text-black dark:text-white mb-1 truncate">{activity.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">{activity.description}</p>

          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(activity.scheduled_at)} at {formatTime(activity.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>
            {activity.genders && activity.genders.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {activity.genders.map(g => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── List Card ─────────────────────────────────────────────────────────────────
function ListCard({ activity }: { activity: Activity }) {
  const spotsLeft = activity.max_participants - activity.current_participants;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row">
      {/* Image */}
      <div className="sm:w-40 h-36 sm:h-auto flex-shrink-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
        {activity.image_url ? (
          <img src={activity.image_url} alt={activity.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-30">
            {activity.category === 'sports' ? '🏃' :
             activity.category === 'gaming' ? '🎮' :
             activity.category === 'outdoor' ? '🌿' :
             activity.category === 'arts' ? '🎨' :
             activity.category === 'fitness' ? '💪' :
             activity.category === 'social' ? '🤝' :
             activity.category === 'education' ? '📚' : '✨'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-black dark:text-white text-base leading-snug">{activity.title}</h3>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${categoryColor(activity.category)}`}>
            {activity.category}
          </span>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">{activity.description}</p>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(activity.scheduled_at)} · {formatTime(activity.scheduled_at)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {activity.location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');
  const [showFilters, setShowFilters] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [modal, setModal] = useState<{ activity: Activity } | null>(null);
  const [modalStep, setModalStep] = useState<'ask' | 'compose'>('ask');
  const [introMessage, setIntroMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({
    ageMin: '',
    ageMax: '',
    distanceMax: '',
    genders: [],
  });

  // Close filter panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.distanceMax) params.set('distanceMax', filters.distanceMax);
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) params.set('creatorEmail', userEmail);

      const res = await fetch(`/api/discover?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      setActivities(data.activities ?? []);
      setSwipeIndex(0);
    } catch (err) {
      setError('Could not load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.distanceMax]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleAccept = () => {
    const currentActivity = activities[swipeIndex];
    if (!currentActivity) return;
    setModal({ activity: currentActivity });
    setModalStep('ask');
    setIntroMessage('');
  };

  const sendJoinRequest = async (message?: string) => {
    const currentActivity = modal?.activity;
    const userEmail = localStorage.getItem('userEmail');
    if (!currentActivity || !userEmail) return;
    setSubmitting(true);
    try {
      await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: currentActivity.id,
          requesterEmail: userEmail,
          message: message || null,
        }),
      });
    } catch {
      // non-fatal
    } finally {
      setSubmitting(false);
      setModal(null);
      setSwipeIndex(i => i + 1);
    }
  };

  const handleReject = () => setSwipeIndex(i => i + 1);

  const remainingCards = activities.slice(swipeIndex);
  const hasMore = swipeIndex < activities.length;

  // Active filter count badge
  const activeFilterCount = [
    filters.ageMin, filters.ageMax, filters.distanceMax,
    ...filters.genders,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* ── Join Request Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6">
            {modalStep === 'ask' ? (
              <>
                <h2 className="text-lg font-bold text-black dark:text-white mb-1">Interested in joining?</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                  Would you like to send a quick message to the host of <span className="font-semibold text-black dark:text-white">{modal.activity.title}</span>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => sendJoinRequest()}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    No, just request
                  </button>
                  <button
                    onClick={() => setModalStep('compose')}
                    className="flex-1 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Yes, send message
                  </button>
                </div>
                <button
                  onClick={() => { setModal(null); }}
                  className="mt-3 w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-black dark:text-white mb-1">Write a message</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Introduce yourself to the host of <span className="font-semibold text-black dark:text-white">{modal.activity.title}</span>.
                </p>
                <textarea
                  value={introMessage}
                  onChange={e => setIntroMessage(e.target.value)}
                  placeholder="Hi! I'd love to join your activity..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStep('ask')}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => sendJoinRequest(introMessage)}
                    disabled={submitting || !introMessage.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {submitting ? 'Sending...' : 'Send & Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">

          {/* Filter button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Filter className="w-5 h-5 text-black dark:text-white" />
              <span className="text-sm font-medium text-black dark:text-white">Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter dropdown */}
            {showFilters && (
              <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-zinc-950 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-5 z-50 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-black dark:text-white">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded">
                    <X className="w-4 h-4 text-black dark:text-white" />
                  </button>
                </div>

                {/* Age Range */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Age Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="0" max="130"
                      value={filters.ageMin}
                      onChange={e => setFilters(p => ({ ...p, ageMin: e.target.value }))}
                      placeholder="Min"
                      className="w-20 px-2 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-white text-sm"
                    />
                    <span className="text-zinc-400 text-sm">to</span>
                    <input
                      type="number" min="0" max="130"
                      value={filters.ageMax}
                      onChange={e => setFilters(p => ({ ...p, ageMax: e.target.value }))}
                      placeholder="Max"
                      className="w-20 px-2 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Max Distance */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Max Distance (miles)</label>
                  <input
                    type="number" min="0"
                    value={filters.distanceMax}
                    onChange={e => setFilters(p => ({ ...p, distanceMax: e.target.value }))}
                    placeholder="No limit"
                    className="w-full px-2 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-white text-sm"
                  />
                </div>

                {/* Gender */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Open To</label>
                  <div className="space-y-1.5">
                    {['Female', 'Male', 'Nonbinary', 'Other'].map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.genders.includes(g)}
                          onChange={() => setFilters(p => ({
                            ...p,
                            genders: p.genders.includes(g)
                              ? p.genders.filter(x => x !== g)
                              : [...p.genders, g],
                          }))}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply / Clear */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFilters({ ageMin: '', ageMax: '', distanceMax: '', genders: [] });
                    }}
                    className="flex-1 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => { fetchActivities(); setShowFilters(false); }}
                    className="flex-1 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-black dark:text-white">Discover</h1>

          {/* View toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium transition-colors ${viewMode === 'swipe' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
              Swipe
            </span>
            <button
              onClick={() => setViewMode(viewMode === 'swipe' ? 'list' : 'swipe')}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
                viewMode === 'list' ? 'bg-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <div className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-black shadow transition-transform duration-300 ${
                viewMode === 'list' ? 'translate-x-9' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${viewMode === 'list' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
              List
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-zinc-300 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading activities...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <p className="text-red-500">{error}</p>
              <button onClick={fetchActivities} className="text-sm underline text-zinc-500">Try again</button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <div className="text-5xl">🔍</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No activities found</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
              Try adjusting your filters, or be the first to create one!
            </p>
            <Link href="/create" className="mt-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Create Activity
            </Link>
          </div>
        )}

        {/* ── SWIPE MODE ── */}
        {!loading && !error && activities.length > 0 && viewMode === 'swipe' && (
          <div className="flex flex-col items-center">
            {hasMore ? (
              <>
                {/* Card stack */}
                <div className="relative w-full max-w-sm h-[520px] mb-8">
                  {remainingCards.slice(0, 3).map((activity, i) => (
                    <SwipeCard
                      key={activity.id}
                      activity={activity}
                      isTop={i === 0}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={handleReject}
                    className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border-2 border-red-300 dark:border-red-800 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <X className="w-6 h-6 text-red-500" />
                  </button>
                  <button
                    onClick={handleAccept}
                    className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border-2 border-green-300 dark:border-green-800 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <Heart className="w-6 h-6 text-green-500" />
                  </button>
                </div>

                {/* Progress */}
                <p className="mt-4 text-xs text-zinc-400">
                  {swipeIndex + 1} of {activities.length}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <div className="text-5xl">🎉</div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">You've seen everything!</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Check back later for new activities.</p>
                <button
                  onClick={() => { setSwipeIndex(0); fetchActivities(); }}
                  className="mt-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── LIST MODE ── */}
        {!loading && !error && activities.length > 0 && viewMode === 'list' && (
          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {activities.map(activity => (
              <ListCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}