import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import CountrySelector from '@/components/CountrySelector';
import { ToastProvider } from '@/components/ui/Toast';

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ToastProvider>
        <CountrySelector />
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
