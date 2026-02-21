'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OAuthCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus(`Error: ${error}`);
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage(
              { type: 'oauth-error', error, provider: state },
              window.location.origin
            );
          }
          setTimeout(() => window.close(), 2000);
          return;
        }

        if (!code) {
          setStatus('No authorization code received');
          setTimeout(() => window.close(), 2000);
          return;
        }

        // Send authorization code to parent window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth-callback', code, provider: state },
            window.location.origin
          );
          setStatus('Authentication successful! Closing...');
          setTimeout(() => window.close(), 1000);
        }
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTimeout(() => window.close(), 2000);
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
          {status}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
}
