import React from 'react';
import { Edit, X } from 'lucide-react';
import { Prototype } from '../types';

interface PrototypeHeaderProps {
  prototype: Prototype;
  onEdit: () => void;
  onExit: () => void;
}

export default function PrototypeHeader({ prototype, onEdit, onExit }: PrototypeHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="mx-auto px-6 flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center gap-4">
          {prototype.logoUrl && (
            <img 
              src={prototype.logoUrl} 
              alt={`${prototype.name} logo`} 
              className="h-8 object-contain" 
            />
          )}
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit prototype"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onExit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Exit prototype"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
