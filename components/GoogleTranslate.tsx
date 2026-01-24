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
      HORIZONTAL: number;
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Define the initialization function
    window.googleTranslateElementInit = function() {
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko,hi,de,it,pt,ru,ar',
              layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
              autoDisplay: false,
            },
            'google_translate_element'
          );
          setIsLoaded(true);
        } catch (error) {
          console.error('Failed to initialize Google Translate:', error);
        }
      }
    };

    // Load the script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => console.error('Failed to load Google Translate script');
      document.head.appendChild(script);
    } else {
      // Script already loaded, initialize immediately
      window.googleTranslateElementInit();
    }
  }, []);

  return (
    <div className="relative">
      {/* Google Translate widget - compact version for header */}
      <div
        id="google_translate_element"
        className="bg-white rounded-lg border border-gray-300 overflow-hidden"
        style={{
          minWidth: '120px',
          maxWidth: '160px'
        }}
      />
    </div>
  );
}
