'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User, LogOut, Settings } from 'lucide-react';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    const storedUsername = localStorage.getItem('username');
    const email = localStorage.getItem('userEmail');

    if (storedUsername) setUsername(storedUsername);
    if (email) {
      fetch(`/api/messages?email=${encodeURIComponent(email)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setUnreadCount(data.unreadCount ?? 0); })
        .catch(() => {});

      fetch(`/api/join-requests?hostEmail=${encodeURIComponent(email)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setPendingRequests(data.requests?.length ?? 0); })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    setUsername(null);
    setIsDropdownOpen(false);
    window.location.href = '/login';
  };

  // Avoid hydration mismatch by not rendering user-specific content until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-black dark:text-white hover:opacity-80 transition-opacity">
            Activity Match
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">Discover</Link>
            <Link href="/create" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">Create</Link>
            <Link href="/requests" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">Requests</Link>
            <Link href="/messages" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">Messages</Link>
          </nav>
          <div className="w-10 h-10" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-black dark:text-white hover:opacity-80 transition-opacity">
          Activity Match
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/discover" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">
            Discover
          </Link>
          <Link href="/create" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">
            Create
          </Link>
          <Link href="/requests" onClick={() => setPendingRequests(0)} className="relative text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors">
            Requests
            {pendingRequests > 0 && (
              <span className="absolute -top-2.5 -right-4 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {pendingRequests > 99 ? '99+' : pendingRequests}
              </span>
            )}
          </Link>
          <Link
            href="/messages"
            onClick={() => setUnreadCount(0)}
            className="relative text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
          >
            Messages
            {unreadCount > 0 && (
              <span className="absolute -top-2.5 -right-4 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        {/* User section */}
        <div className="flex items-center gap-4">
          {username && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{username}</span>
          )}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="User menu"
            >
              <User className="w-6 h-6 text-black dark:text-white" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50">
                {username ? (
                  <>
                    <div className="px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {username}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Log In
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}