'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, User, Calendar } from 'lucide-react';

interface PermissionsFormProps {
  provider: 'google' | 'outlook';
  userEmail: string;
  onComplete: (data: { username: string; birthday: string }) => void;
  onCancel: () => void;
}

export default function PermissionsForm({
  provider,
  userEmail,
  onComplete,
  onCancel,
}: PermissionsFormProps) {
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !birthday) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Validate username length
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    // Validate birthday format (YYYY-MM-DD)
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(birthday)) {
      setError('Please use YYYY-MM-DD format for birthday');
      setLoading(false);
      return;
    }

    try {
      // TODO: Send permissions data to your backend
      const response = await fetch('/api/auth/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: userEmail,
          username,
          birthday,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save permissions');
      }

      onComplete({ username, birthday });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Permissions Request
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {provider === 'google' ? 'Google' : 'Outlook'} is asking for the following information:
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (Read-only) */}
          <div>
            <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Mail className="w-4 h-4 mr-2" />
              Email Address
            </label>
            <div className="flex items-center px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
              {userEmail}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <User className="w-4 h-4 mr-2" />
              Username
            </label>
            <Input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              minLength={3}
              maxLength={30}
              required
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              Birthday
            </label>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Allow & Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
