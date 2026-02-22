'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Sparkles, RefreshCw } from 'lucide-react';
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

function base64ToFile(base64: string, mimeType: string, filename: string): File {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new File([ab], filename, { type: mimeType });
}

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [aiModal, setAiModal] = useState<'ask' | 'generating' | 'preview' | null>(null);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiMimeType, setAiMimeType] = useState('image/png');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [pendingSubmit, setPendingSubmit] = useState<ActivityForm | null>(null);

  const [formData, setFormData] = useState<ActivityForm>({
    title: '', description: '', category: 'sports', customCategory: '',
    date: '', time: '', location: '', maxParticipants: '',
    genders: [], ageMin: '', ageMax: '', distance: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
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

  const generateAiImage = async (data: ActivityForm) => {
    setAiGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          category: data.category === 'other' ? data.customCategory : data.category,
          description: data.description,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? 'Image generation failed');
      }
      if (!result.imageBase64) {
        throw new Error('No image returned — please try again');
      }
      setAiImageBase64(result.imageBase64);
      setAiMimeType(result.mimeType ?? 'image/png');
      setAiModal('preview');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate image');
      setAiModal('ask');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAcceptAiImage = () => {
    if (!aiImageBase64 || !pendingSubmit) return;
    const file = base64ToFile(aiImageBase64, aiMimeType, 'ai-generated.png');
    setImageFile(file);
    setImagePreview(`data:${aiMimeType};base64,${aiImageBase64}`);
    setAiModal(null);
    submitActivity(pendingSubmit, file);
  };

  const handleSkipAiImage = () => {
    setAiModal(null);
    if (pendingSubmit) submitActivity(pendingSubmit, null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location || !formData.maxParticipants) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.category === 'other' && !formData.customCategory.trim()) {
      setError('Please specify a custom category');
      return;
    }
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) { router.push('/login'); return; }

    if (!imageFile) {
      setPendingSubmit({ ...formData });
      setAiModal('ask');
      setAiError('');
      return;
    }

    await submitActivity(formData, imageFile);
  };

  const submitActivity = async (data: ActivityForm, imgFile: File | null) => {
    setLoading(true);
    setError('');
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) { router.push('/login'); return; }

      const fd = new FormData();
      fd.append('title', data.title);
      fd.append('description', data.description);
      fd.append('category', data.category === 'other' ? data.customCategory : data.category);
      fd.append('date', data.date);
      fd.append('time', data.time);
      fd.append('location', data.location);
      fd.append('maxParticipants', data.maxParticipants);
      fd.append('creatorEmail', userEmail);
      fd.append('genders', JSON.stringify(data.genders));
      fd.append('ageMin', data.ageMin);
      fd.append('ageMax', data.ageMax);
      fd.append('distance', data.distance);
      if (imgFile) fd.append('image', imgFile);

      const response = await fetch('/api/create', { method: 'POST', body: fd });
      if (!response.ok) {
        const text = await response.text();
        let msg = 'Failed to create activity';
        try { msg = JSON.parse(text).message || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }

      setSuccess('🎉 Activity created successfully! Redirecting to discover...');
      setFormData({ title: '', customCategory: '', description: '', category: 'sports', date: '', time: '', location: '', maxParticipants: '', genders: [], ageMin: '', ageMax: '', distance: '' });
      setImagePreview(null);
      setImageFile(null);
      setPendingSubmit(null);
      setTimeout(() => router.push('/discover'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* AI Image Modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6">

            {aiModal === 'ask' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-bold text-black dark:text-white">Generate an AI image?</h2>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  You didn't upload an image. Want Imagen AI to generate a cover photo for:
                </p>
                <p className="font-semibold text-black dark:text-white mb-6">"{pendingSubmit?.title}"</p>
                {aiError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setAiModal('generating'); generateAiImage(pendingSubmit!); }}
                    className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Yes, generate with Imagen AI
                  </button>
                  <button
                    onClick={handleSkipAiImage}
                    className="w-full py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    No, skip image
                  </button>
                </div>
              </>
            )}

            {aiModal === 'generating' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-12 h-12 border-2 border-zinc-300 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Generating image with Imagen AI...</p>
                <p className="text-xs text-zinc-400">This may take 5–10 seconds</p>
              </div>
            )}

            {aiModal === 'preview' && aiImageBase64 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-bold text-black dark:text-white">AI Generated Image</h2>
                </div>
                <img
                  src={`data:${aiMimeType};base64,${aiImageBase64}`}
                  alt="AI generated activity"
                  className="w-full rounded-xl mb-4 object-cover max-h-64"
                />
                <div className="flex flex-col gap-2">
                  <button onClick={handleAcceptAiImage} className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition-opacity border-2 border-black">
                    ✓ Use this image
                  </button>
                  <button
                    onClick={() => { setAiModal('generating'); generateAiImage(pendingSubmit!); }}
                    disabled={aiGenerating}
                    className="w-full py-2.5 rounded-xl border-2 border-zinc-400 dark:border-zinc-500 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate another
                  </button>
                  <button onClick={handleSkipAiImage} className="w-full text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 py-1 transition-colors">
                    Skip, no image
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-black dark:text-white">Create Activity</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-8">
              {error && <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
              {success && <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Activity Title *</label>
                  <Input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Weekend Basketball Game" disabled={loading} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description *</label>
                  <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell others about your activity..." disabled={loading} required rows={5} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                    <option value="sports">Sports</option>
                    <option value="arts">Arts & Culture</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="social">Social</option>
                    <option value="gaming">Gaming</option>
                    <option value="fitness">Fitness</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.category === 'other' && (
                    <Input type="text" name="customCategory" value={formData.customCategory} onChange={handleChange} placeholder="Enter custom category..." disabled={loading} className="mt-3" required />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Date *</label>
                    <Input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Time *</label>
                    <Input type="time" name="time" value={formData.time} onChange={handleChange} disabled={loading} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Location *</label>
                  <Input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Central Park, New York" disabled={loading} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Max Participants *</label>
                  <Input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} placeholder="Enter maximum number of participants" disabled={loading} min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Event Image
                    <span className="ml-2 text-xs text-zinc-400 font-normal flex-shrink-0">— or let AI generate one ✨</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{imagePreview ? 'Change image' : 'Upload image'}</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading} className="hidden" />
                    </label>
                    {imagePreview && (
                      <div className="relative w-24 h-24">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Gender(s) Interested (Optional)</label>
                  <div className="space-y-2">
                    {['Female', 'Male', 'Nonbinary', 'Other'].map(gender => (
                      <label key={gender} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.genders.includes(gender)} onChange={() => handleGenderToggle(gender)} disabled={loading} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Age Range (Optional)</label>
                  <div className="flex gap-3 items-center">
                    <Input type="number" name="ageMin" value={formData.ageMin} onChange={handleChange} placeholder="Min" disabled={loading} min="0" max="130" />
                    <span className="text-zinc-600 dark:text-zinc-400">to</span>
                    <Input type="number" name="ageMax" value={formData.ageMax} onChange={handleChange} placeholder="Max" disabled={loading} min="0" max="130" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Max Distance (miles) (Optional)</label>
                  <Input type="number" name="distance" value={formData.distance} onChange={handleChange} placeholder="Leave empty for no limit" disabled={loading} min="0" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Link href="/discover" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" disabled={loading}>Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Activity'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-6 sticky top-32">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Guidelines</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Title Tips</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Be clear and descriptive. Include the type of activity.</p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Description</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Explain what you'll be doing and what to expect.</p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <h4 className="font-semibold text-black dark:text-white text-sm">AI Image Generation</h4>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No image? Imagen AI will offer to generate a beautiful cover photo based on your activity.</p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Location</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Be specific so people can find you easily.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}