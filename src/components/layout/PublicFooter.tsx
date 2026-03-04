'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function PublicFooter() {
  const t = useTranslations('footer');
  const pathname = usePathname();

  // Hide on app routes
  if (pathname.startsWith('/app') || pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-1.5">
              <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-lg font-bold text-gray-900">ReStyle</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{t('about')}</h3>
            <ul className="mt-3 space-y-2.5">
              <li><Link href="/how-it-works" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('howItWorks')}</Link></li>
              <li><Link href="/about" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('aboutUs')}</Link></li>
              <li><Link href="/sustainability" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('sustainability')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{t('support')}</h3>
            <ul className="mt-3 space-y-2.5">
              <li><Link href="/help" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('helpCenter')}</Link></li>
              <li><Link href="/safety" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('safety')}</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{t('legal')}</h3>
            <ul className="mt-3 space-y-2.5">
              <li><Link href="/terms" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('privacy')}</Link></li>
              <li><Link href="/cookies" className="text-sm text-gray-500 hover:text-teal-600 transition">{t('cookies')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ReStyle. {t('allRightsReserved')}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-gray-400 hover:text-teal-600 transition">{t('terms')}</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-teal-600 transition">{t('privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
