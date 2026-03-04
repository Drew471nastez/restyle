'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
];

export default function CountrySelector() {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState('RO');

  useEffect(() => {
    const alreadySelected = localStorage.getItem('country_selected');
    if (alreadySelected) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  function handleConfirm() {
    localStorage.setItem('country', selected);
    localStorage.setItem('country_selected', 'true');
    setShow(false);
  }

  function handleClose() {
    localStorage.setItem('country_selected', 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Where do you live?</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select your country to see relevant items</p>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition -mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Country list */}
        <div className="px-3 pb-2 max-h-[55vh] overflow-y-auto">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelected(country.code)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors ${
                selected === country.code
                  ? 'bg-violet-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-xl leading-none">{country.flag}</span>
              <span className={`text-sm ${
                selected === country.code ? 'font-semibold text-violet-700' : 'text-gray-700'
              }`}>
                {country.name}
              </span>
              {selected === country.code && (
                <svg className="ml-auto h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            className="w-full h-10 bg-violet-500 text-white rounded-lg text-sm font-semibold hover:bg-violet-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
