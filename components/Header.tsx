'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import Image from 'next/image';

declare global {
  interface Window {
    google?: {
      translate: {
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
      };
    };
    googleTranslateElementInit: () => void;
  }
}

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [translateInitialized, setTranslateInitialized] = useState(false);

  // Initialize Google Translate for header
  useEffect(() => {
    if (user && !translateInitialized) {
      const initializeHeaderTranslate = () => {
        if (window.google && window.google.translate) {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'en,tl,ceb,es,fr,zh-CN,ja,ko,hi,de,it,pt,ru,ar',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
              },
              'header_translate_element'
            );
            setTranslateInitialized(true);
          } catch (error) {
            console.error('Failed to initialize Google Translate in header:', error);
          }
        }
      };

      // Load script if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onload = initializeHeaderTranslate;
        script.onerror = () => console.error('Failed to load Google Translate script');
        document.head.appendChild(script);
      } else {
        initializeHeaderTranslate();
      }
    }
  }, [user, translateInitialized]);

  return (
    <> 
      <header className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 sticky top-0 z-50 shadow-md">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <h1
            className="text-2xl font-bold cursor-pointer flex items-center gap-2"
            onClick={() => router.push('/')}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Image
                  src="/BLogo.png"
                  alt="B-READY Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span>B-READY</span>
              </div>
              <span className="text-xs opacity-90 -mt-1">Real-time reporting and response</span>
            </div>
          </h1>
          {user && (
            <div className="flex items-center gap-2">
              {/* Google Translate - moved here */}
              <div className="h-8 overflow-hidden">
                <div id="header_translate_element" className="text-xs scale-75 origin-top-left"></div>
              </div>

              <button
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </button>
            </div>
          )}
        </nav>
      </header>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
