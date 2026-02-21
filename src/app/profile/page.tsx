'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, User, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  birthday: string;
  gender: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    birthday: '',
    gender: 'prefer not to say',
  });

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data.user);
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
    setError('');
    setSuccess('');

    if (!editData.username || !editData.birthday || !editData.gender) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email,
          username: editData.username,
          birthday: editData.birthday,
          gender: editData.gender,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const data = await response.json();
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
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const confirmationText = "Delete my account. I'm 100% sure I want to delete it and take full accountability.";

    if (deleteConfirmation !== confirmationText) {
      setError('Please type the confirmation message exactly as shown');
      return;
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      setSuccess('Account deleted successfully. Redirecting...');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleteConfirmation('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back Home
        </Link>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="md:col-span-2">
            {/* Basic Info */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8 mb-6">
              <h1 className="text-3xl font-bold text-black dark:text-white mb-6">Profile Settings</h1>

              {/* User ID */}
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  <User className="w-4 h-4 mr-2" />
                  User ID
                </label>
                <div className="text-zinc-900 dark:text-white font-mono text-sm break-all">
                  {profile.id}
                </div>
              </div>

              {/* Email */}
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </label>
                <div className="text-zinc-900 dark:text-white">
                  {profile.email}
                </div>
              </div>

              {/* Password Section */}
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <Lock className="w-4 h-4 mr-2" />
                    Password
                  </label>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="password"
                    value="••••••••"
                    disabled
                    className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white flex-1 text-sm"
                  />
                </div>
                <Button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  variant="outline"
                  className="w-full"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>

                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="mt-4 p-4 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        minLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Update Password
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Editable Info */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white">Account Information</h2>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? 'outline' : 'default'}
                  size="sm"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Username
                    </label>
                    <Input
                      type="text"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      minLength={3}
                      maxLength={30}
                      required
                    />
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Birthday
                    </label>
                    <Input
                      type="date"
                      value={editData.birthday}
                      onChange={(e) => setEditData({ ...editData, birthday: e.target.value })}
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      required
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="nonbinary">Non-binary</option>
                      <option value="other">Other</option>
                      <option value="prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full">
                    Save Changes
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Username Display */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      <User className="w-4 h-4 mr-2" />
                      Username
                    </label>
                    <div className="text-zinc-900 dark:text-white">
                      {editData.username}
                    </div>
                  </div>

                  {/* Birthday Display */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      Birthday
                    </label>
                    <div className="text-zinc-900 dark:text-white">
                      {editData.birthday}
                    </div>
                  </div>

                  {/* Gender Display */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Gender
                    </label>
                    <div className="text-zinc-900 dark:text-white capitalize">
                      {editData.gender === 'prefer not to say' ? 'Prefer not to say' : editData.gender}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activities Section */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Activities Post */}
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">My Activities Posts</h3>
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      No activities posted yet
                    </p>
                  </div>
                </div>

                {/* Activities I've Joined */}
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">Activities I've Joined</h3>
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      No activities joined yet
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone - Delete Account */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-red-200 dark:border-red-900 p-8 mt-6">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteConfirmation('');
                  setError('');
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              >
                Delete Account
              </button>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md max-h-96 overflow-y-auto">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Delete Account?</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 font-mono bg-zinc-50 dark:bg-zinc-900 p-3 rounded border border-zinc-200 dark:border-zinc-700 select-none pointer-events-none">
                      {`Delete my account. I'm 100% sure I want to delete it and take full accountability.`}
                    </p>

                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Type the confirmation message above
                        </label>
                        <Input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          onPaste={(e) => e.preventDefault()}
                          placeholder="Type the message..."
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmation('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <button
                          type="submit"
                          disabled={deleteConfirmation !== `Delete my account. I'm 100% sure I want to delete it and take full accountability.`}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
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
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-center">
                  <div className="text-2xl font-bold text-black dark:text-white">0</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Activities Posted</div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-center">
                  <div className="text-2xl font-bold text-black dark:text-white">0</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Activities Joined</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
