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
    googleTranslateElementInitMobile: () => void;
  }
}

export function GoogleTranslate() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Define the initialization function for desktop
    window.googleTranslateElementInit = function() {
      if (window.google && window.google.translate) {
        try {
          // Initialize desktop widget
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko,hi,de,it,pt,ru,ar',
              layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
              autoDisplay: false,
            },
            'google_translate_element_desktop'
          );
          setIsLoaded(true);
        } catch (error) {
          console.error('Failed to initialize Google Translate:', error);
        }
      }
    };

    // Define the initialization function for mobile modal
    window.googleTranslateElementInitMobile = function() {
      if (window.google && window.google.translate) {
        try {
          // Initialize mobile widget
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko,hi,de,it,pt,ru,ar',
              layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
              autoDisplay: false,
            },
            'google_translate_element_mobile'
          );
        } catch (error) {
          console.error('Failed to initialize Google Translate mobile:', error);
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

  const handleMobileClick = () => {
    setShowModal(true);
    // Initialize mobile widget when modal opens
    setTimeout(() => {
      if (window.google && !document.getElementById('google_translate_element_mobile')?.hasChildNodes()) {
        window.googleTranslateElementInitMobile();
      }
    }, 100);
  };

  return (
    <>
      {/* Desktop/Large Screen - Always visible widget */}
      <div className="fixed bottom-6 left-6 z-50">
        <div
          id="google_translate_element_desktop"
          className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          style={{
            minWidth: '200px',
            maxWidth: '300px'
          }}
        />
      </div>

      {/* Mobile/Tablet - Icon button that opens modal */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
        <button
          onClick={handleMobileClick}
          className="w-14 h-14 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center text-xl"
          aria-label="Translate"
        >
          🌐
        </button>
      </div>

      {/* Modal for mobile/tablet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Translate</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div
                id="google_translate_element_mobile"
                className="bg-white rounded-lg overflow-hidden"
                style={{
                  minWidth: '100%',
                  maxWidth: '100%'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
