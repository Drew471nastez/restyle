'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ShoppingBag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 bg-white pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5">
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold text-green-600">
                ReStyle
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              {t('tagline')}
            </p>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('about')}
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('aboutUs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('howItWorks')}
                </Link>
              </li>
              <li>
                <Link
                  href="/sustainability"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('sustainability')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('support')}
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('helpCenter')}
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('safety')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('legal')}
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  {t('cookies')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ReStyle. {t('allRightsReserved')}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-xs text-gray-400 hover:text-green-600 transition-colors"
            >
              {t('terms')}
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-green-600 transition-colors"
            >
              {t('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
