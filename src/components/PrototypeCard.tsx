import { useState } from 'react';
import { MoreVertical, Edit, Copy, Link, Trash2 } from 'lucide-react';
import { Prototype } from '../types';

interface PrototypeCardProps {
  prototype: Prototype;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyUrl: (id: string) => void;
}

export default function PrototypeCard({ 
  prototype, 
  onOpen, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onCopyUrl 
}: PrototypeCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsMenuOpen(false);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative flex flex-col h-full"
      style={{ borderLeftWidth: '6px', borderLeftColor: prototype.primaryColor }}
      onClick={() => onOpen(prototype.id)}
    >
      {/* Menu Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleMenuToggle}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={(e) => handleMenuAction(e, () => onEdit(prototype.id))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                style={{ color: '#464F5E' }}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={(e) => handleMenuAction(e, () => onDuplicate(prototype.id))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                style={{ color: '#464F5E' }}
              >
                <Copy size={16} />
                Duplicate
              </button>
              <button
                onClick={(e) => handleMenuAction(e, () => onCopyUrl(prototype.id))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                style={{ color: '#464F5E' }}
              >
                <Link size={16} />
                Copy URL
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={(e) => handleMenuAction(e, () => onDelete(prototype.id))}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Logo */}
      <div className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {prototype.logoUrl ? (
          <img 
            src={prototype.logoUrl} 
            alt={`${prototype.name} logo`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-medium text-xl"
            style={{ backgroundColor: prototype.primaryColor }}
          >
            {prototype.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="text-xl font-medium mb-1" style={{ color: '#464F5E' }}>
        {prototype.name}
      </h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-shrink-0">{prototype.description}</p>

      {/* Footer - Always at bottom */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-regular bg-gray-100 text-gray-600">
            {prototype.steps?.length || 0} steps
          </span>
        </div>
        <span className="text-xs font-regular text-gray-500">{new Date(prototype.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
