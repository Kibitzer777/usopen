'use client';

import { Loader2 } from 'lucide-react';

interface HeaderProps {
  isRevalidating?: boolean;
}

export function Header({ isRevalidating = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">US Open</h1>
          {isRevalidating && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
        </div>
        <div className="text-sm text-gray-500">
          Tennis Championships 2025
        </div>
      </div>
    </header>
  );
}

