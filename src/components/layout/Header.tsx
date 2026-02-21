'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User, LogOut, Settings } from 'lucide-react';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Get username from localStorage after login
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    setUsername(null);
    setIsDropdownOpen(false);
    window.location.href = '/login';
  };

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-black dark:text-white hover:opacity-80 transition-opacity"
          >
            Activity Match
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/discover"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/create"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Create
            </Link>
            <Link
              href="/requests"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Requests
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {username && (
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {username}
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                aria-label="User menu"
              >
                <User className="w-6 h-6 text-black dark:text-white" />
              </button>

              {/* Dropdown Menu */}
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
    </>
  );
}
