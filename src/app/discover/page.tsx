'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';

type ViewMode = 'swipe' | 'list';

export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      
      {/* Mode Switcher */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-black dark:text-white">Discover</h1>
          
          {/* Custom Toggle Switch */}
          <div className="flex items-center gap-6">
            <span className={`text-sm font-medium transition-colors ${viewMode === 'swipe' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
              Swipe Mode
            </span>
            
            <button
              onClick={() => setViewMode(viewMode === 'swipe' ? 'list' : 'swipe')}
              className={`relative inline-flex items-center h-10 w-20 rounded-full transition-all duration-300 ${
                viewMode === 'swipe'
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-zinc-100 dark:bg-zinc-900'
              }`}
            >
              {/* Toggle Circle */}
              <div
                className={`inline-block h-8 w-8 transform rounded-full bg-white dark:bg-zinc-800 shadow-md transition-transform duration-300 ${
                  viewMode === 'swipe' ? 'translate-x-1' : 'translate-x-10'
                }`}
              />
            </button>
            
            <span className={`text-sm font-medium transition-colors ${viewMode === 'list' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>
              List Mode
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'swipe' ? (
          <div className="flex items-center justify-center min-h-[70vh] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Swipe Mode
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Swipe through activities to find matches
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[70vh] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                List Mode
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Browse activities in a list view
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
