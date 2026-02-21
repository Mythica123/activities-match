'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload } from 'lucide-react';
import Link from 'next/link';

interface ActivityForm {
  title: string;
  description: string;
  category: string;
  customCategory: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: string;
  genders: string[];
  ageMin: string;
  ageMax: string;
  distance: string;
}

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ActivityForm>({
    title: '',
    description: '',
    category: 'sports',
    customCategory: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    genders: [],
    ageMin: '',
    ageMax: '',
    distance: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenderToggle = (gender: string) => {
    setFormData(prev => ({
      ...prev,
      genders: prev.genders.includes(gender)
        ? prev.genders.filter(g => g !== gender)
        : [...prev.genders, gender],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location || !formData.maxParticipants) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate custom category if "other" is selected
      if (formData.category === 'other' && !formData.customCategory.trim()) {
        setError('Please specify a custom category');
        setLoading(false);
        return;
      }

      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        router.push('/login');
        return;
      }

      // Create FormData to handle image upload
      const formDataRequest = new FormData();
      formDataRequest.append('title', formData.title);
      formDataRequest.append('description', formData.description);
      formDataRequest.append('category', formData.category === 'other' ? formData.customCategory : formData.category);
      formDataRequest.append('date', formData.date);
      formDataRequest.append('time', formData.time);
      formDataRequest.append('location', formData.location);
      formDataRequest.append('maxParticipants', formData.maxParticipants);
      formDataRequest.append('creatorEmail', userEmail);
      formDataRequest.append('genders', JSON.stringify(formData.genders));
      formDataRequest.append('ageMin', formData.ageMin);
      formDataRequest.append('ageMax', formData.ageMax);
      formDataRequest.append('distance', formData.distance);
      if (imageFile) {
        formDataRequest.append('image', imageFile);
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formDataRequest,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create activity');
      }

      const data = await response.json();
      setSuccess('🎉 Activity created successfully! Redirecting to discover...');
      
      // Reset form
      setFormData({
        title: '',
        customCategory: '',
        description: '',
        category: 'sports',
        date: '',
        time: '',
        location: '',
        maxParticipants: '',
        genders: [],
        ageMin: '',
        ageMax: '',
        distance: '',
      });
      setImagePreview(null);
      setImageFile(null);

      // Redirect to discover page after success
      setTimeout(() => {
        router.push('/discover');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* Page Header */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-black dark:text-white">Create Activity</h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Activity Title */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Activity Title *
                  </label>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Weekend Basketball Game"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Description *
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell others about your activity..."
                    disabled={loading}
                    required
                    rows={5}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="sports">Sports</option>
                    <option value="arts">Arts & Culture</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="social">Social</option>
                    <option value="gaming">Gaming</option>
                    <option value="fitness">Fitness</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Custom Category Input */}
                  {formData.category === 'other' && (
                    <Input
                      type="text"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleChange}
                      placeholder="Enter custom category..."
                      disabled={loading}
                      className="mt-3"
                      required
                    />
                  )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Date *
                    </label>
                    <Input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Time *
                    </label>
                    <Input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Location *
                  </label>
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Central Park, New York"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Max Participants *
                  </label>
                  <Input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    placeholder="Enter maximum number of participants"
                    disabled={loading}
                    min="1"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Event Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {imagePreview ? 'Change image' : 'Upload image'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <div className="relative w-24 h-24">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    Gender(s) Interested (Optional)
                  </label>
                  <div className="space-y-2">
                    {['Female', 'Male', 'Nonbinary', 'Other'].map((gender) => (
                      <label key={gender} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.genders.includes(gender)}
                          onChange={() => handleGenderToggle(gender)}
                          disabled={loading}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Age Range (Optional)
                  </label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="number"
                      name="ageMin"
                      value={formData.ageMin}
                      onChange={handleChange}
                      placeholder="Min"
                      disabled={loading}
                      min="0"
                      max="130"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400">to</span>
                    <Input
                      type="number"
                      name="ageMax"
                      value={formData.ageMax}
                      onChange={handleChange}
                      placeholder="Max"
                      disabled={loading}
                      min="0"
                      max="130"
                    />
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Max Distance (miles) (Optional)
                  </label>
                  <Input
                    type="number"
                    name="distance"
                    value={formData.distance}
                    onChange={handleChange}
                    placeholder="Leave empty for no limit"
                    disabled={loading}
                    min="0"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Link href="/discover" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Activity'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Guidelines */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-6 sticky top-32">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Guidelines</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Title Tips</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Be clear and descriptive. Include the type of activity.
                  </p>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Description</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Explain what you&apos;ll be doing and what to expect.
                  </p>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Category</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Choose the category that best matches your activity.
                  </p>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Location</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Be specific so people can find you easily.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
