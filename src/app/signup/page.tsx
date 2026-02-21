'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, User, Calendar } from 'lucide-react';
import PermissionsForm from '@/components/auth/PermissionsForm';

type SignupMethod = 'oauth' | 'email';
type Provider = 'google' | 'outlook';

interface OAuthUser {
  provider: Provider;
  email: string;
  id: string;
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<SignupMethod>('oauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('prefer not to say');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthUser, setOauthUser] = useState<OAuthUser | null>(null);

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      const { type, code, error: callbackError, provider } = event.data;

      if (type === 'oauth-error') {
        setError(`${provider} signup failed: ${callbackError}`);
        setLoading(false);
      } else if (type === 'oauth-callback' && code) {
        // Code received from OAuth provider
        handleOAuthCodeReceived(code, provider);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  useEffect(() => {
    // Get email and password from URL params (for email method)
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');

    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (passwordParam) setPassword(decodeURIComponent(passwordParam));
  }, [searchParams]);

  const handleOAuthCodeReceived = async (code: string, provider: Provider) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/auth/${provider}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data = await response.json();

      // If user already exists, just log them in
      if (!data.isNewUser && data.user.username) {
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userEmail', data.user.email);
        window.location.href = '/';
        return;
      }

      // For new users, show permissions form
      setOauthUser({
        provider: provider as Provider,
        email: data.user.email,
        id: data.user.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  const openOAuthPopup = (provider: Provider) => {
    setLoading(true);
    setError('');

    const oauthUrls: Record<Provider, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/auth/callback`
      )}&response_type=code&scope=email%20profile&state=google`,
      outlook: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/auth/callback`
      )}&response_type=code&scope=openid%20profile%20email&state=outlook`,
    };

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popupUrl = oauthUrls[provider];
    if (!popupUrl.includes('client_id=')) {
      setError(
        `Please configure ${provider.toUpperCase()}_CLIENT_ID environment variables`
      );
      setLoading(false);
      return;
    }

    window.open(
      popupUrl,
      `${provider}-signup`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleGoogleSignup = () => {
    openOAuthPopup('google');
  };

  const handleOutlookSignup = () => {
    openOAuthPopup('outlook');
  };

  const handlePermissionsComplete = async (data: {
    username: string;
    birthday: string;
    gender: string;
  }) => {
    try {
      localStorage.setItem('username', data.username);
      localStorage.setItem('userEmail', oauthUser?.email || '');
      window.location.href = '/';
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
      setOauthUser(null);
    }
  };

  const handlePermissionsCancel = () => {
    setOauthUser(null);
    setError('');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password || !username || !birthday || !gender) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(birthday)) {
      setError('Please use YYYY-MM-DD format for birthday');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username,
          birthday,
          gender,
          provider: 'email',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Signup failed');
      }

      const data = await response.json();
      
      // Save to localStorage and redirect
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userEmail', data.user.email);
      
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show permissions form if OAuth user is set
  if (oauthUser) {
    return (
      <PermissionsForm
        provider={oauthUser.provider}
        userEmail={oauthUser.email}
        onComplete={handlePermissionsComplete}
        onCancel={handlePermissionsCancel}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8">
          <h1 className="text-2xl font-bold text-center text-black dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6">
            Sign up for Activity Match
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* OAuth Options */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={handleGoogleSignup}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>

            <Button
              onClick={handleOutlookSignup}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M3.5 2h10v8.5H3.5V2M3.5 13.5h10V22H3.5v-8.5M13 2h7.5v8.5H13V2M13 13.5h7.5V22H13v-8.5"
                />
              </svg>
              Sign up with Outlook
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300 dark:border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">
                or
              </span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={6}
                required
              />
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

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={loading}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-black dark:text-white hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
