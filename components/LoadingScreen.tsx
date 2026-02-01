import { ReactNode } from 'react';

interface LoadingScreenProps {
  children?: ReactNode;
}

export function LoadingScreen({ children }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img
          src="/Logo.svg"
          alt="B-READY Logo"
          className="w-16 h-16 mx-auto mb-4 animate-pulse"
        />
        <p>Loading...</p>
        {children}
      </div>
    </div>
  );
}