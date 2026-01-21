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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize Google Translate once
    if (!isInitialized) {
      // Define the initialization function before loading the script
      window.googleTranslateElementInit = function() {
        if (window.google && window.google.translate) {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
              },
              'google_translate_element'
            );
            setIsInitialized(true);
          } catch (error) {
            console.error('Failed to initialize Google Translate:', error);
          }
        }
      };

      // Check if script is already loaded
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
    }
  }, [isInitialized]);

  // Handle visibility of the translate widget
  useEffect(() => {
    const element = document.getElementById('google_translate_element');
    if (element) {
      if (showTranslate) {
        element.style.display = 'block';
        // Force a re-render of the translate element if needed
        if (isInitialized && window.google && window.google.translate) {
          try {
            // Google Translate may need to be reinitialized when shown
            element.innerHTML = '';
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
              },
              'google_translate_element'
            );
          } catch (error) {
            console.error('Failed to re-initialize Google Translate:', error);
          }
        }
      } else {
        element.style.display = 'none';
      }
    }
  }, [showTranslate, isInitialized]);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={() => setShowTranslate(!showTranslate)}
        className="px-4 py-2 bg-primary text-white rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2"
      >
        🌐 <span className="hidden sm:inline">Translate</span>
      </button>
      {/* Always render the element but control visibility with CSS */}
      <div
        id="google_translate_element"
        className="mt-2 bg-white rounded-lg shadow-lg p-2"
        style={{ display: showTranslate ? 'block' : 'none' }}
      />
    </div>
  );
}
