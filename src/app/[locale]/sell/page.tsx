'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createListing } from '@/actions/listings';
import { CATEGORIES, CONDITIONS, SIZES } from '@/lib/constants';
import { Camera, X, Upload, Loader2 } from 'lucide-react';

export default function SellPage() {
  const t = useTranslations('sell');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);

  const currentCategory = CATEGORIES.find((c) => c.slug === selectedCategory);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages((prev) => [...prev, base64].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('images', JSON.stringify(images));

    const result = await createListing(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.listing) {
      router.push(`/item/${result.listing.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-sm text-gray-500 mb-6">Fill in the details to list your item</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Photos</h2>
            <p className="text-xs text-gray-500 mb-4">Add up to 5 photos. The first one will be the cover.</p>
            <div className="flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div key={i} className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-xl border border-gray-200">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-violet-500 text-white px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {images.length < 5 && (
                <label className="flex h-24 w-24 sm:h-28 sm:w-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-violet-500 hover:text-violet-500">
                  <Camera className="h-6 w-6" />
                  <span className="text-[10px] font-medium">Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Details section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>

            <div>
              <label htmlFor="title" className="block text-sm text-gray-700 mb-1">{t('listingTitle')}</label>
              <input
                id="title"
                name="title"
                placeholder={t('titlePlaceholder')}
                required
                maxLength={100}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm text-gray-700 mb-1">{t('description')}</label>
              <textarea
                id="description"
                name="description"
                placeholder={t('descriptionPlaceholder')}
                required
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm text-gray-700 mb-1">{t('brand')}</label>
              <input
                id="brand"
                name="brand"
                placeholder={t('brandPlaceholder')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          {/* Category & attributes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Category & attributes</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('category')}</label>
                <select
                  name="category"
                  required
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                >
                  <option value="">{t('selectCategory')}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('subcategory')}</label>
                <select
                  name="subcategory"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                >
                  <option value="">{t('selectSubcategory')}</option>
                  {currentCategory?.subcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('size')}</label>
                <select
                  name="size"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                >
                  <option value="">{t('selectSize')}</option>
                  {SIZES.clothing.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('condition')}</label>
                <select
                  name="condition"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                >
                  <option value="">{t('selectCondition')}</option>
                  {CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Price</h2>
            <div className="relative max-w-xs">
              <input
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-gray-200 pl-14 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">RON</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {loading ? t('publishing') : t('publish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
