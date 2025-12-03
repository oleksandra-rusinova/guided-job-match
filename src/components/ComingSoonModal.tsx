import { X } from 'lucide-react';
import PrimaryButton from './PrimaryButton';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  title = 'Coming Soon',
  message = 'This feature is to be developed in future.',
}: ComingSoonModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium" style={{ color: '#464F5E' }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm" style={{ color: '#464F5E' }}>
            {message}
          </p>

          <div className="flex justify-end pt-2">
            <PrimaryButton onClick={onClose}>
              OK
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

