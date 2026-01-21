'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const translateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isLoaded && !window.google) {
      window.googleTranslateElementInit = function() {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko,hi,de,it,pt,ru,ar',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );

          // Style the Google Translate widget to match our theme
          setTimeout(() => {
            const translateElement = document.getElementById('google_translate_element');
            if (translateElement) {
              // Hide the "Powered by Google Translate" text
              const poweredBy = translateElement.querySelector('.goog-logo-link');
              if (poweredBy) {
                (poweredBy as HTMLElement).style.display = 'none';
              }

              // Style the select dropdown
              const select = translateElement.querySelector('select');
              if (select) {
                (select as HTMLSelectElement).style.cssText = `
                  background: white;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 8px 12px;
                  font-size: 14px;
                  color: #374151;
                  min-width: 180px;
                  cursor: pointer;
                  transition: all 0.2s ease;
                `;

                (select as HTMLSelectElement).addEventListener('focus', function() {
                  this.style.borderColor = '#3b82f6';
                  this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                });

                (select as HTMLSelectElement).addEventListener('blur', function() {
                  this.style.borderColor = '#e5e7eb';
                  this.style.boxShadow = 'none';
                });
              }

              // Style the translate button if it exists
              const button = translateElement.querySelector('input[type="button"]');
              if (button) {
                (button as HTMLInputElement).style.cssText = `
                  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 8px 16px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s ease;
                `;

                (button as HTMLInputElement).addEventListener('mouseenter', function() {
                  this.style.opacity = '0.9';
                  this.style.transform = 'translateY(-1px)';
                });

                (button as HTMLInputElement).addEventListener('mouseleave', function() {
                  this.style.opacity = '1';
                  this.style.transform = 'translateY(0)';
                });
              }
            }
          }, 1000);
        }
      };

      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => console.error('Failed to load Google Translate');
      document.head.appendChild(script);
    }
  }, [isOpen, isLoaded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (translateRef.current && !translateRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={translateRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Language translation options"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span className="hidden sm:inline">Translate</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Language Translation</h3>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Select your preferred language to translate the page content.
            </p>

            <div
              id="google_translate_element"
              className="bg-gray-50 rounded-md p-3 border border-gray-200"
            />

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Translation powered by Google Translate
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
