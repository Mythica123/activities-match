'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Sparkles, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';

const STANDARD_CATEGORIES = ['sports', 'arts', 'outdoor', 'social', 'gaming', 'fitness', 'education'];

interface ActivityForm {
  title: string;
  description: string;
  categories: string[];
  newCategory: string;
  date: string;
  time: string;
  location: string;
  zipCode: string;
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

  // Custom categories
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatLoading, setNewCatLoading] = useState(false);
  const [newCatError, setNewCatError] = useState('');

  // Zip code geocoding
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const [zipResolved, setZipResolved] = useState<{ city: string; state: string; lat: number; lng: number } | null>(null);

  // AI modal
  const [aiModal, setAiModal] = useState<'ask' | 'generating' | 'preview' | null>(null);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiMimeType, setAiMimeType] = useState('image/png');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [pendingSubmit, setPendingSubmit] = useState<ActivityForm | null>(null);

  const [formData, setFormData] = useState<ActivityForm>({
    title: '', description: '', categories: [], newCategory: '',
    date: '', time: '', location: '', zipCode: '',
    maxParticipants: '', genders: [], ageMin: '', ageMax: '', distance: '',
  });

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      setCustomCategories((d.categories ?? []).map((c: { name: string }) => c.name));
    }).catch(() => {});
    // Zip code intentionally not pre-filled — host may be at a different location
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      genders: prev.genders.includes(gender) ? prev.genders.filter(g => g !== gender) : [...prev.genders, gender],
    }));
  };

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
    }));
  };

  const handleAddCategory = async () => {
    const name = formData.newCategory.trim().toLowerCase();
    if (!name) return;
    if (!customCategories.includes(name)) setCustomCategories(prev => [...prev, name]);
    setFormData(prev => ({
      ...prev,
      newCategory: '',
      categories: prev.categories.includes(name) ? prev.categories : [...prev.categories, name],
    }));
    setAddingCategory(false);
  };

  const lookupZip = async (zip: string) => {
    if (!zip || zip.length < 5) return;
    setZipLoading(true);
    setZipError('');
    try {
      const res = await fetch(`/api/geocode?zip=${zip}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Invalid zip code');
      setZipResolved({ city: data.city, state: data.state, lat: data.latitude, lng: data.longitude });
    } catch (err) {
      setZipError(err instanceof Error ? err.message : 'Zip lookup failed');
      setZipResolved(null);
    } finally {
      setZipLoading(false);
    }
  };

  const generateAiImage = async (data: ActivityForm) => {
    setAiGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, category: data.categories[0] ?? 'social', description: data.description }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message ?? 'Image generation failed');
      if (!result.imageBase64) throw new Error('No image returned — please try again');
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
    if (formData.categories.length === 0) {
      setError('Please select at least one category');
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
      fd.append('categories', JSON.stringify(data.categories));
      fd.append('date', data.date);
      fd.append('time', data.time);
      fd.append('location', data.location);
      fd.append('maxParticipants', data.maxParticipants);
      fd.append('creatorEmail', userEmail);
      fd.append('genders', JSON.stringify(data.genders));
      fd.append('ageMin', data.ageMin);
      fd.append('ageMax', data.ageMax);
      fd.append('distance', data.distance);
      if (data.zipCode && zipResolved) {
        fd.append('zipCode', data.zipCode);
        fd.append('latitude', String(zipResolved.lat));
        fd.append('longitude', String(zipResolved.lng));
        localStorage.setItem('userZip', data.zipCode);
        localStorage.setItem('userLat', String(zipResolved.lat));
        localStorage.setItem('userLng', String(zipResolved.lng));
        localStorage.setItem('userCity', zipResolved.city);
        localStorage.setItem('userState', zipResolved.state);
      }
      if (imgFile) fd.append('image', imgFile);

      const response = await fetch('/api/create', { method: 'POST', body: fd });
      if (!response.ok) {
        const text = await response.text();
        let msg = 'Failed to create activity';
        try { msg = JSON.parse(text).message || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }

      setSuccess('🎉 Activity created successfully! Redirecting to discover...');
      setFormData({ title: '', description: '', categories: [], newCategory: '', date: '', time: '', location: '', zipCode: '', maxParticipants: '', genders: [], ageMin: '', ageMax: '', distance: '' });
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

  const allCategories = [...STANDARD_CATEGORIES, ...customCategories.filter(c => !STANDARD_CATEGORIES.includes(c))];

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
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">You didn't upload an image. Want Imagen AI to generate a cover photo for:</p>
                <p className="font-semibold text-black dark:text-white mb-6">"{pendingSubmit?.title}"</p>
                {aiError && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-600 dark:text-red-400">{aiError}</p></div>}
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setAiModal('generating'); generateAiImage(pendingSubmit!); }}
                    className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />Yes, generate with Imagen AI
                  </button>
                  <button onClick={handleSkipAiImage} className="w-full py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
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
                <img src={`data:${aiMimeType};base64,${aiImageBase64}`} alt="AI generated" className="w-full rounded-xl mb-4 object-cover max-h-64" />
                <div className="flex flex-col gap-2">
                  <button onClick={handleAcceptAiImage} className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition-opacity border-2 border-black">✓ Use this image</button>
                  <button onClick={() => { setAiModal('generating'); generateAiImage(pendingSubmit!); }} disabled={aiGenerating}
                    className="w-full py-2.5 rounded-xl border-2 border-zinc-400 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />Generate another
                  </button>
                  <button onClick={handleSkipAiImage} className="w-full text-center text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1 transition-colors">Skip, no image</button>
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

                {/* Multi-Category */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Categories * <span className="font-normal text-zinc-400 text-xs ml-1">select all that apply</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allCategories.map(cat => (
                      <button key={cat} type="button" onClick={() => handleCategoryToggle(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-all border-2 ${
                          formData.categories.includes(cat)
                            ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-700 shadow-sm'
                            : 'bg-white text-zinc-600 border-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700'
                        }`}>
                        {formData.categories.includes(cat) ? `✓ ${cat}` : cat}
                      </button>
                    ))}
                    <button type="button" onClick={() => setAddingCategory(!addingCategory)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium text-zinc-500 border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                      <Plus className="w-3.5 h-3.5" />Other
                    </button>
                  </div>
                  {formData.categories.length > 0 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Selected: {formData.categories.join(', ')}</p>
                  )}
                  {addingCategory && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="text" name="newCategory" value={formData.newCategory}
                        onChange={handleChange} placeholder="e.g., cooking, hiking..."
                        disabled={newCatLoading}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      />
                      <Button type="button" onClick={handleAddCategory} disabled={newCatLoading || !formData.newCategory.trim()} className="flex-shrink-0">
                        {newCatLoading ? '...' : 'Add'}
                      </Button>
                    </div>
                  )}
                  {newCatError && <p className="text-xs text-red-500 mt-1">{newCatError}</p>}
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

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Zip Code <span className="font-normal text-zinc-400 text-xs ml-1">— used for distance matching</span>
                  </label>
                  <div className="flex gap-2">
                    <Input type="text" name="zipCode" value={formData.zipCode} maxLength={5}
                      onChange={e => { handleChange(e); if (e.target.value.length === 5) lookupZip(e.target.value); }}
                      placeholder="e.g. 01002" disabled={loading} />
                    {zipLoading && <span className="text-sm text-zinc-400 self-center">Looking up...</span>}
                  </div>
                  {zipError && <p className="text-xs text-red-500 mt-1">{zipError}</p>}
                  {zipResolved && <p className="text-xs text-green-600 dark:text-green-400 mt-1">📍 {zipResolved.city}, {zipResolved.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Max Participants *</label>
                  <Input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} placeholder="Enter maximum number of participants" disabled={loading} min="1" required />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Event Image <span className="ml-2 text-xs text-zinc-400 font-normal">— or let AI generate one ✨</span>
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
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Max Distance for Participants (miles) (Optional)
                  </label>
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800 p-6 sticky top-32">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Guidelines</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Title Tips</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Be clear and descriptive. Include the type of activity.</p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Categories</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Select multiple categories that fit. Add a custom one if none match — it'll be available for everyone.</p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-semibold text-black dark:text-white text-sm mb-2">Zip Code</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Enter your zip so people nearby can find your activity using distance filters.</p>
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