'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Filter, X } from 'lucide-react';

type ViewMode = 'swipe' | 'list';

const DEFAULT_ACTIVITIES = [
  'Academics',
  'Outdoor',
  'Adventures',
  'Scenery',
  'Night Life',
  'Indoor',
  'Board Games',
  'Cutesy',
  'Gaming',
  'Movies/Shows',
  'Meditation',
  'Animals',
  'Exercise',
  'Reading',
  'Shopping',
  'Sport Games',
  'Concerts',
  'Singing',
  'Theater',
  'Anime',
];

interface Filters {
  ageMin: number;
  ageMax: number;
  distanceMin: number | '';
  distanceMax: number | '';
  genders: string[];
  activities: string[];
  otherGender: string;
}

export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');
  const [showFilters, setShowFilters] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [availableActivities, setAvailableActivities] = useState(DEFAULT_ACTIVITIES);
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({
    ageMin: 18,
    ageMax: 65,
    distanceMin: '',
    distanceMax: '',
    genders: [],
    activities: [],
    otherGender: '',
  });

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAgeChange = (type: 'min' | 'max', value: string) => {
    const num = parseInt(value) || 0;
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'ageMin' : 'ageMax']: num,
    }));
  };

  const handleDistanceChange = (type: 'min' | 'max', value: string) => {
    const num = value === '' ? '' : parseInt(value) || 0;
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'distanceMin' : 'distanceMax']: num,
    }));
  };

  const handleGenderChange = (gender: string) => {
    if (gender === 'All') {
      if (filters.genders.includes('All')) {
        setFilters(prev => ({ ...prev, genders: [] }));
      } else {
        setFilters(prev => ({
          ...prev,
          genders: ['Female', 'Male', 'Nonbinary', 'Other', 'Do not prefer to say'],
        }));
      }
    } else {
      setFilters(prev => ({
        ...prev,
        genders: prev.genders.includes(gender)
          ? prev.genders.filter(g => g !== gender)
          : [...prev.genders, gender],
      }));
    }
  };

  const handleActivityToggle = (activity: string) => {
    setFilters(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity],
    }));
  };

  const handleAddActivity = () => {
    if (activitySearch.trim() && !availableActivities.includes(activitySearch.trim())) {
      setAvailableActivities(prev => [...prev, activitySearch.trim()]);
      handleActivityToggle(activitySearch.trim());
      setActivitySearch('');
    }
  };

  const filteredActivities = availableActivities.filter(activity =>
    activity.toLowerCase().includes(activitySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      
      {/* Mode Switcher */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          {/* Left Section - Filter Button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Filters"
            >
              <Filter className="w-5 h-5 text-black dark:text-white" />
              <span className="text-sm font-medium text-black dark:text-white">Filter</span>
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 z-50 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-black dark:text-white" />
                  </button>
                </div>

                {/* Age Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    Age Range
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={filters.ageMin}
                      onChange={(e) => handleAgeChange('min', e.target.value)}
                      className="w-20 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-black dark:text-white"
                      placeholder="Min"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400">≤ age ≤</span>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={filters.ageMax}
                      onChange={(e) => handleAgeChange('max', e.target.value)}
                      className="w-20 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-black dark:text-white"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Distance Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    Distance (miles)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      min="0"
                      value={filters.distanceMin}
                      onChange={(e) => handleDistanceChange('min', e.target.value)}
                      className="w-20 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-black dark:text-white"
                      placeholder="Min"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400">≤ distance ≤</span>
                    <input
                      type="number"
                      min="0"
                      value={filters.distanceMax}
                      onChange={(e) => handleDistanceChange('max', e.target.value)}
                      className="w-20 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-black dark:text-white"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    Gender(s)
                  </label>
                  <div className="space-y-2">
                    {['Female', 'Male', 'Nonbinary', 'Do not prefer to say', 'All'].map((gender) => (
                      <label key={gender} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gender === 'All' ? 
                            filters.genders.length === 5 : 
                            filters.genders.includes(gender)
                          }
                          onChange={() => handleGenderChange(gender)}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{gender}</span>
                      </label>
                    ))}
                    <div className="mt-2 pt-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={filters.genders.includes('Other') || filters.otherGender !== ''}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, genders: [...prev.genders, 'Other'] }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                genders: prev.genders.filter(g => g !== 'Other'),
                                otherGender: '',
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Other:</span>
                        <input
                          type="text"
                          value={filters.otherGender}
                          onChange={(e) => setFilters(prev => ({ ...prev, otherGender: e.target.value }))}
                          placeholder="Specify..."
                          className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-black dark:text-white"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    Activities
                  </label>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search or add activity..."
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-black dark:text-white text-sm"
                    />
                    {activitySearch.trim() && !availableActivities.includes(activitySearch.trim()) && (
                      <button
                        onClick={handleAddActivity}
                        className="mt-2 w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        Add "{activitySearch}"
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-scroll pr-2 scrollbar scrollbar-thumb-blue-500 scrollbar-track-zinc-200 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-zinc-800">
                    {filteredActivities.map((activity) => (
                      <label key={activity} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.activities.includes(activity)}
                          onChange={() => handleActivityToggle(activity)}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{activity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
