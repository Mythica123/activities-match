'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Check, X, Calendar, MapPin, Users, User } from 'lucide-react';

interface RequesterProfile {
  id: string;
  username: string;
  gender: string | null;
  birthday: string | null;
  age: number | null;
}

interface Activity {
  id: string;
  title: string;
  scheduled_at: string;
  location: string;
  category: string;
}

interface JoinRequest {
  id: string;
  created_at: string;
  status: string;
  activity_id: string;
  requester_id: string;
  requester: RequesterProfile | null;
  activitiesCreated: number;
  matchesCount: number;
  activity: Activity | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function ProfileStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-black dark:text-white">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function RequestCard({
  request,
  onRespond,
}: {
  request: JoinRequest;
  onRespond: (id: string, action: 'accept' | 'reject') => void;
}) {
  const { requester, activity, activitiesCreated, matchesCount } = request;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      {/* Activity info bar */}
      {activity && (
        <div className="bg-zinc-50 dark:bg-zinc-800/60 px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-black dark:text-white">{activity.title}</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(activity.scheduled_at)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {activity.location}
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col sm:flex-row gap-5 items-start">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </div>

        {/* Profile info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-black dark:text-white text-base mb-0.5">
            {requester?.username ?? 'Unknown user'}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            {requester?.gender && <span>{requester.gender}</span>}
            {requester?.age != null && <span>Age {requester.age}</span>}
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <ProfileStat label="Activities Created" value={activitiesCreated} />
            <ProfileStat label="Events Joined" value={matchesCount} />
          </div>
        </div>

        {/* Accept / Reject buttons */}
        <div className="flex gap-3 flex-shrink-0 self-center">
          <button
            onClick={() => onRespond(request.id, 'reject')}
            className="w-11 h-11 rounded-full border-2 border-red-300 dark:border-red-800 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Reject"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
          <button
            onClick={() => onRespond(request.id, 'accept')}
            className="w-11 h-11 rounded-full border-2 border-green-300 dark:border-green-800 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            title="Accept"
          >
            <Check className="w-5 h-5 text-green-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState<string | null>(null); // request id being responded to
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) { router.push('/login'); return; }
    fetchRequests(email);
  }, []);

  const fetchRequests = async (email: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/join-requests?hostEmail=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to load requests');
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setError('Could not load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    setResponding(requestId);
    try {
      const res = await fetch('/api/join-requests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, hostEmail: email, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Failed to respond');
      }
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
      showToast(
        action === 'accept'
          ? '✅ Accepted! An approval message has been sent.'
          : '❌ Request rejected.',
        action === 'accept' ? 'success' : 'error'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-black dark:text-white">Join Requests</h1>
          {requests.length > 0 && (
            <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2.5 py-1 rounded-full">
              {requests.length} pending
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3">
            <div className="text-5xl">📭</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No pending requests</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              When someone wants to join your activity, they'll show up here.
            </p>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className={responding === request.id ? 'opacity-50 pointer-events-none' : ''}>
                <RequestCard request={request} onRespond={handleRespond} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}