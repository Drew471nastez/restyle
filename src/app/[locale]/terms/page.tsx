import { getTranslations } from 'next-intl/server';

export default async function TermsPage() {
  const t = await getTranslations('legal');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('termsTitle')}</h1>
          <p className="text-sm text-gray-400 mb-8">{t('lastUpdated')}: 2025-01-01</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. {t('acceptanceTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                By accessing and using ReStyle (&ldquo;the Platform&rdquo;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use the Platform. ReStyle reserves the right to update these terms at any time, and your continued use of the Platform constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. {t('accountTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to update your information as necessary.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. {t('listingsTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sellers are responsible for the accuracy of their listings, including descriptions, photos, sizing, and condition. All items must be authentic and legally owned by the seller. ReStyle prohibits the sale of counterfeit goods, stolen items, and any items that violate applicable laws. ReStyle reserves the right to remove any listing at its sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. {t('transactionsTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                All payments are processed through our secure payment partner. Funds are held in escrow until the buyer confirms receipt and satisfaction with the item. Sellers receive payment after the buyer confirms the order or after the automatic release period of 48 hours. A platform fee is deducted from each sale as outlined in our fee schedule.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. {t('shippingTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sellers must ship items within the timeframe specified at the time of sale. Items must be packaged securely and in accordance with shipping carrier requirements. Sellers are responsible for providing accurate shipping information and tracking numbers. ReStyle is not responsible for items lost or damaged during shipping.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. {t('disputesTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                In the event of a dispute between buyer and seller, ReStyle will act as a mediator to help resolve the issue. Buyers may open a dispute if the item received significantly differs from the listing description. ReStyle&apos;s decision on disputes is final and binding on both parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. {t('liabilityTitle')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                ReStyle acts as a marketplace platform and is not a party to transactions between buyers and sellers. ReStyle is not liable for the quality, safety, or legality of items listed. The Platform is provided &ldquo;as is&rdquo; without warranties of any kind. In no event shall ReStyle be liable for any indirect, incidental, or consequential damages.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
