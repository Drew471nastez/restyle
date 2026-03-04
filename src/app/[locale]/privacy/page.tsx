import { getTranslations } from 'next-intl/server';

export default async function PrivacyPage() {
  const t = await getTranslations('legal');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('privacyTitle')}</h1>
          <p className="text-sm text-gray-400 mb-8">{t('lastUpdated')}: 2025-01-01</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. {t('infoCollectionTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We collect information you provide directly, such as your name, email address, shipping address, and payment information when you create an account or make a purchase. We also collect information automatically, including your IP address, browser type, device information, and browsing activity on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. {t('infoUseTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use your information to provide and improve our services, process transactions, communicate with you about your account and orders, personalize your experience, and ensure platform safety and security. We may also use your information to send promotional communications, which you can opt out of at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. {t('infoSharingTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We share your information with payment processors to complete transactions, shipping providers to deliver orders, and service providers who help us operate the Platform. We may share information when required by law or to protect the rights and safety of ReStyle and its users. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. {t('dataSecurity')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We implement industry-standard security measures to protect your personal information, including encryption of data in transit and at rest, secure payment processing, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. {t('cookiesTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences, analyze usage patterns, and deliver relevant content. You can control cookie settings through your browser, though disabling cookies may affect Platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. {t('yourRightsTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Under applicable data protection laws (including GDPR), you have the right to access, correct, delete, or export your personal data. You may also object to or restrict certain processing activities. To exercise these rights, please contact us at privacy@restyle.app. We will respond to your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. {t('contactTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@restyle.app or write to us at our registered office address.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
