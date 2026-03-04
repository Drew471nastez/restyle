'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

const COUNTRIES = [
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
];

export default function CountrySelector() {
  const t = useTranslations('countrySelector');
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState('RO');

  useEffect(() => {
    const alreadySelected = localStorage.getItem('country_selected');
    if (!alreadySelected) {
      setShow(true);
    }
  }, []);

  function handleConfirm() {
    localStorage.setItem('country', selected);
    localStorage.setItem('country_selected', 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-teal-500 px-6 py-8 text-center">
          <div className="mx-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Globe className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('title')}</h2>
          <p className="mt-1 text-sm text-teal-100">{t('subtitle')}</p>
        </div>

        {/* Country list */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-1.5">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelected(country.code)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-colors ${
                  selected === country.code
                    ? 'bg-teal-50 border-2 border-teal-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className="text-2xl">{country.flag}</span>
                <span className={`text-sm font-medium ${
                  selected === country.code ? 'text-teal-700' : 'text-gray-700'
                }`}>
                  {country.name}
                </span>
                {selected === country.code && (
                  <svg className="ml-auto h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <div className="p-4 pt-2">
          <button
            onClick={handleConfirm}
            className="w-full h-12 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
