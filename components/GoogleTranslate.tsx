'use client';

import { useEffect, useState } from 'react';

interface GoogleTranslateElement {
  TranslateElement: {
    new (options: {
      pageLanguage: string;
      includedLanguages: string;
      layout: number;
      autoDisplay: boolean;
    }, elementId: string): void;
    InlineLayout: {
      SIMPLE: number;
    };
  };
}

declare global {
  interface Window {
    google?: {
      translate: GoogleTranslateElement;
    };
    googleTranslateElementInit: () => void;
  }
}

export function GoogleTranslate() {
  const [showTranslate, setShowTranslate] = useState(false);

  useEffect(() => {
    if (showTranslate && !window.google) {
      window.googleTranslateElementInit = function() {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => console.error('Failed to load Google Translate');
      document.head.appendChild(script);
    }
  }, [showTranslate]);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={() => setShowTranslate(!showTranslate)}
        className="px-4 py-2 bg-primary text-white rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2"
      >
        🌐 <span className="hidden sm:inline">Translate</span>
      </button>
      {showTranslate && (
        <div
          id="google_translate_element"
          className="mt-2 bg-white rounded-lg shadow-lg p-2"
        />
      )}
    </div>
  );
}
