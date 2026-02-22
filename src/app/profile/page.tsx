'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, User, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  birthday: string;
  gender: string;
}

interface Activity {
  id: string;
  title: string;
  scheduled_at: string;
  location: string;
  category: string;
  max_participants: number;
  current_participants: number;
}

interface Stats {
  activitiesHosted: number;
  activitiesJoined: number;
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
  return CATEGORY_COLORS[cat?.toLowerCase()] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function ActivityCard({ activity }: { activity: Activity }) {
  const spotsLeft = activity.max_participants - activity.current_participants;
  return (
    <div className="flex-shrink-0 w-64 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-black dark:text-white text-sm leading-snug line-clamp-2">{activity.title}</h4>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${categoryColor(activity.category)}`}>
          {activity.category}
        </span>
      </div>
      <div className="space-y-1.5 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>{formatDate(activity.scheduled_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{activity.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span>{activity.current_participants}/{activity.max_participants} members · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
        </div>
      </div>
    </div>
  );
}

function ScrollableActivities({ activities, emptyText }: { activities: Activity[]; emptyText: string }) {
  if (activities.length === 0) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
      {activities.map(a => <ActivityCard key={a.id} activity={a} />)}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ activitiesHosted: 0, activitiesJoined: 0 });
  const [hostedActivities, setHostedActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: '', birthday: '', gender: 'prefer not to say' });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) { router.push('/login'); return; }

      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();

      setProfile(data.user);
      setStats(data.stats);
      setHostedActivities(data.hostedActivities ?? []);
      setJoinedActivities(data.joinedActivities ?? []);
      setEditData({
        username: data.user.username,
        birthday: data.user.birthday,
        gender: data.user.gender || 'prefer not to say',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, ...editData }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const data = await res.json();
      setProfile(data.user);
      localStorage.setItem('username', data.user.username);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError('New passwords do not match'); return; }
    if (passwordData.newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const confirmText = "Delete my account. I'm 100% sure I want to delete it and take full accountability.";
    if (deleteConfirmation !== confirmText) { setError('Please type the confirmation message exactly as shown'); return; }
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleteConfirmation('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back Home
        </Link>

        {error && <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">

            {/* Basic Info */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <h1 className="text-2xl font-bold text-black dark:text-white mb-6">Profile Settings</h1>

              <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1"><Mail className="w-3.5 h-3.5 mr-1.5" />Email</label>
                <p className="text-zinc-900 dark:text-white text-sm">{profile.email}</p>
              </div>

              <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1"><User className="w-3.5 h-3.5 mr-1.5" />User ID</label>
                <p className="text-zinc-900 dark:text-white font-mono text-xs break-all">{profile.id}</p>
              </div>

              {/* Password */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3"><Lock className="w-3.5 h-3.5 mr-1.5" />Password</label>
                <Button onClick={() => setShowPasswordForm(!showPasswordForm)} variant="outline" className="w-full">
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>
                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                    <Input type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
                    <Input type="password" placeholder="New password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                    <Input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
                    <Button type="submit" className="w-full">Update Password</Button>
                  </form>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white">Account Information</h2>
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'outline' : 'default'} size="sm">
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Username</label>
                    <Input type="text" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} minLength={3} maxLength={30} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Birthday</label>
                    <Input type="date" value={editData.birthday} onChange={e => setEditData({ ...editData, birthday: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Gender</label>
                    <select value={editData.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="nonbinary">Non-binary</option>
                      <option value="other">Other</option>
                      <option value="prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: 'Username', value: editData.username },
                    { icon: Calendar, label: 'Birthday', value: editData.birthday },
                    { icon: User, label: 'Gender', value: editData.gender === 'prefer not to say' ? 'Prefer not to say' : editData.gender },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <label className="flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                        <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
                      </label>
                      <p className="text-zinc-900 dark:text-white text-sm capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activities Hosted */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">Activities I've Hosted</h2>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{stats.activitiesHosted} total</span>
              </div>
              <ScrollableActivities activities={hostedActivities} emptyText="You haven't hosted any activities yet. Create one!" />
            </div>

            {/* Activities Joined */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">Activities I've Joined</h2>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{stats.activitiesJoined} total</span>
              </div>
              <ScrollableActivities activities={joinedActivities} emptyText="You haven't joined any activities yet. Go discover some!" />
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-red-200 dark:border-red-900 p-8">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Once you delete your account, there is no going back.</p>
              <button
                onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmation(''); setError(''); }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors text-sm"
              >
                Delete Account
              </button>

              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">Delete Account?</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">This action cannot be undone.</p>
                    <p className="text-sm font-mono bg-zinc-50 dark:bg-zinc-900 p-3 rounded border border-zinc-200 dark:border-zinc-700 select-none pointer-events-none mb-4">
                      {"Delete my account. I'm 100% sure I want to delete it and take full accountability."}
                    </p>
                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <Input
                        type="text"
                        value={deleteConfirmation}
                        onChange={e => setDeleteConfirmation(e.target.value)}
                        onPaste={e => e.preventDefault()}
                        placeholder="Type the message above..."
                        required
                      />
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmation(''); }} className="flex-1">Cancel</Button>
                        <button
                          type="submit"
                          disabled={deleteConfirmation !== "Delete my account. I'm 100% sure I want to delete it and take full accountability."}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors text-sm"
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sticky top-24">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <User className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                </div>
                <h3 className="font-bold text-black dark:text-white">{profile.username}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{profile.gender}</p>
              </div>

              <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Quick Stats</h4>
              <div className="space-y-3">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">{stats.activitiesHosted}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Activities Hosted</div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">{stats.activitiesJoined}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Activities Joined</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Link href="/create" className="block w-full text-center py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  + Create Activity
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}