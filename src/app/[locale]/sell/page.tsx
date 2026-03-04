'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createListing } from '@/actions/listings';
import { CATEGORIES, CONDITIONS, SIZES } from '@/lib/constants';

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

    // Placeholder: in production, upload to Supabase Storage and get URLs
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newImages.push(URL.createObjectURL(files[i]));
    }
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div>
          <Label>{t('images')}</Label>
          <p className="mb-2 text-xs text-gray-500">{t('imagesDescription')}</p>
          <div className="flex flex-wrap gap-3">
            {images.map((src, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70"
                >
                  x
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-green-500 hover:text-green-500">
                <span className="text-2xl">+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">{t('listingTitle')}</Label>
          <Input
            id="title"
            name="title"
            placeholder={t('titlePlaceholder')}
            required
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Textarea
            id="description"
            name="description"
            placeholder={t('descriptionPlaceholder')}
            required
            rows={4}
            maxLength={1000}
          />
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label htmlFor="brand">{t('brand')}</Label>
          <Input
            id="brand"
            name="brand"
            placeholder={t('brandPlaceholder')}
          />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('category')}</Label>
            <Select
              name="category"
              required
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('subcategory')}</Label>
            <Select name="subcategory">
              <SelectTrigger>
                <SelectValue placeholder={t('selectSubcategory')} />
              </SelectTrigger>
              <SelectContent>
                {currentCategory?.subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Size & Condition */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('size')}</Label>
            <Select name="size" required>
              <SelectTrigger>
                <SelectValue placeholder={t('selectSize')} />
              </SelectTrigger>
              <SelectContent>
                {SIZES.clothing.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('condition')}</Label>
            <Select name="condition" required>
              <SelectTrigger>
                <SelectValue placeholder={t('selectCondition')} />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">{t('price')}</Label>
          <div className="relative">
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className="pl-12"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              RON
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? t('publishing') : t('publish')}
        </Button>
      </form>
    </div>
  );
}
