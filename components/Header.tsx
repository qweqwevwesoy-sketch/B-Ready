'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { GoogleTranslate } from './GoogleTranslate';
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
            <GoogleTranslate />
          </div>
          {user && (
            <button
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
          )}
        </nav>
      </header>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
