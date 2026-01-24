'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import Image from 'next/image';

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="flex items-center gap-4">
            {/* Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Google Translate Dropdown */}
            <div className="relative">
              <select
                id="google_translate_element"
                className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer appearance-none"
                onChange={(e) => {
                  const target = e.target.value;
                  // Trigger Google Translate
                  if (window.google && window.google.translate) {
                    const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (selectField) {
                      selectField.value = target;
                      selectField.dispatchEvent(new Event('change'));
                    }
                  }
                }}
              >
                <option value="en">English</option>
                <option value="tl">Filipino</option>
                <option value="ceb">Cebuano</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="zh-CN">中文 (简体)</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="hi">हिन्दी</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="ru">Русский</option>
                <option value="ar">العربية</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

          </div>
        </nav>
      </header>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
