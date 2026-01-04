'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';

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
            onClick={() => router.push(user ? '/dashboard' : '/')}
          >
            <span>🚨</span>
            B-READY
          </h1>
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

