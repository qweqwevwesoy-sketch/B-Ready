'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleTranslate } from './GoogleTranslate';
import { UserMenu } from './UserMenu';

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/BLogo.svg" alt="B-Ready Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold text-primary">B-READY</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/real-time-map" className="text-gray-700 hover:text-primary">
                  Real-Time Map
                </Link>
                <Link href="/safety-tips" className="text-gray-700 hover:text-primary">
                  Safety Tips
                </Link>
                <Link href="/status-update" className="text-gray-700 hover:text-primary">
                  Status Update
                </Link>
              </>
            )}
            <GoogleTranslate />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
