'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface ModalManagerContextType {
  getNextZIndex: () => number;
  releaseZIndex: (zIndex: number) => void;
  getModalZIndex: (modalType: string) => number;
}

const ModalManagerContext = createContext<ModalManagerContextType | undefined>(undefined);

export function ModalManagerProvider({ children }: { children: React.ReactNode }) {
  const [usedZIndices, setUsedZIndices] = useState<number[]>([]);
  const [modalStack, setModalStack] = useState<string[]>([]);

  // Base z-index values for different modal types
  const BASE_Z_INDICES = {
    sidebar: 40,           // Sidebar should be below most modals
    chatbox: 60,          // ChatBox should be above sidebar but below critical modals
    mapPicker: 70,        // MapPicker should be above ChatBox
    fab: 80,              // FAB (Floating Action Button) modals should be high
    reportInfo: 90,       // Report info modals should be very high
    notification: 100,    // Notification modals should be highest
  };

  const getNextZIndex = useCallback((): number => {
    // Find the highest available z-index starting from 50
    let zIndex = 50;
    while (usedZIndices.includes(zIndex)) {
      zIndex += 10;
    }

    // Mark this z-index as used
    setUsedZIndices(prev => [...prev, zIndex].sort((a, b) => a - b));
    return zIndex;
  }, [usedZIndices]);

  const releaseZIndex = useCallback((zIndex: number) => {
    setUsedZIndices(prev => prev.filter(z => z !== zIndex));
  }, []);

  const getModalZIndex = useCallback((modalType: string): number => {
    // Return the base z-index for this modal type
    return BASE_Z_INDICES[modalType as keyof typeof BASE_Z_INDICES] || 50;
  }, []);

  const pushToModalStack = useCallback((modalId: string) => {
    setModalStack(prev => [...prev, modalId]);
  }, []);

  const removeFromModalStack = useCallback((modalId: string) => {
    setModalStack(prev => prev.filter(id => id !== modalId));
  }, []);

  const getCurrentTopModal = useCallback((): string | null => {
    return modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
  }, [modalStack]);

  return (
    <ModalManagerContext.Provider
      value={{
        getNextZIndex,
        releaseZIndex,
        getModalZIndex
      }}
    >
      {children}
    </ModalManagerContext.Provider>
  );
}

export function useModalManager() {
  const context = useContext(ModalManagerContext);
  if (!context) {
    throw new Error('useModalManager must be used within a ModalManagerProvider');
  }
  return context;
}