'use client';

import { useState } from 'react';
import { useModalManager } from '@/contexts/ModalManager';
import { categories } from '@/lib/categories';
import type { Category } from '@/types';

interface FABProps {
  onCategorySelect: (category: Category) => void;
}

export function FAB({ onCategorySelect }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryClick = (category: Category) => {
    onCategorySelect(category);
    setIsOpen(false);
  };

  // Get proper z-index from ModalManager
  const { getModalZIndex } = useModalManager();
  const fabZIndex = getModalZIndex('fab');

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 z-50 flex items-center justify-center text-2xl font-bold"
        aria-label="Report Emergency"
      >
        +
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: fabZIndex }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Report Emergency</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Select the type of emergency you want to report:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors duration-200 text-left flex items-center gap-4 group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                      {category.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-800">{category.name}</div>
                      <div className="text-sm text-gray-500">
                        {category.subcategories.slice(0, 2).join(', ')}
                        {category.subcategories.length > 2 && '...'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
