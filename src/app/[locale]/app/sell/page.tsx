'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createListing } from '@/actions/listings';
import { CATEGORIES, CONDITIONS, SIZES, MAX_IMAGES_PER_LISTING } from '@/lib/constants';
import { ImagePlus, X, Loader2 } from 'lucide-react';

export default function SellPage() {
  const t = useTranslations('sell');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sizeType, setSizeType] = useState<'clothing' | 'shoes_eu' | 'numeric'>('clothing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = CATEGORIES.find((c) => c.slug === category);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES_PER_LISTING - images.length;
    const toAdd = Array.from(files).slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviews((prev) => [...prev, base64]);
        setImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('images', JSON.stringify(images));
      formData.set('category', category);
      formData.set('subcategory', subcategory);

      const result = await createListing(formData);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push('/app/listings');
    } catch {
      setError(t('unexpectedError'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t('photos')}
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            {t('photosHint', { max: MAX_IMAGES_PER_LISTING })}
          </p>
          <div className="flex flex-wrap gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 sm:h-28 sm:w-28"
              >
                <img
                  src={preview}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-teal-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {t('cover')}
                  </span>
                )}
              </div>
            ))}
            {images.length < MAX_IMAGES_PER_LISTING && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-teal-400 hover:text-teal-500 sm:h-28 sm:w-28"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="mt-1 text-[10px]">{t('addPhoto')}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </section>

        {/* Details Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t('details')}
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t('itemTitle')}
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder={t('titlePlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t('description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                placeholder={t('descriptionPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label
                htmlFor="brand"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t('brand')}
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                placeholder={t('brandPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </section>

        {/* Category & Attributes Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t('categoryAndAttributes')}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  {t('category')}
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory('');
                  }}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">{t('selectCategory')}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="subcategory"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  {t('subcategory')}
                </label>
                <select
                  id="subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{t('selectSubcategory')}</option>
                  {selectedCategory?.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="condition"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  {t('condition')}
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">{t('selectCondition')}</option>
                  {CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('sizeType')}
                </label>
                <select
                  value={sizeType}
                  onChange={(e) =>
                    setSizeType(
                      e.target.value as 'clothing' | 'shoes_eu' | 'numeric'
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="clothing">{t('clothingSizes')}</option>
                  <option value="shoes_eu">{t('shoeSizes')}</option>
                  <option value="numeric">{t('numericSizes')}</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="size"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {t('size')}
              </label>
              <select
                id="size"
                name="size"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">{t('selectSize')}</option>
                {SIZES[sizeType].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Price Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t('pricing')}
          </h2>
          <div>
            <label
              htmlFor="price"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              {t('price')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                RON
              </span>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-14 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">{t('priceHint')}</p>
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:flex-none sm:px-8"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-8"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? t('publishing') : t('publish')}
          </button>
        </div>
      </form>
    </div>
  );
}
