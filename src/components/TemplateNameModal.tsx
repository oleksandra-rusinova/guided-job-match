import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import SystemField from './SystemField';

interface TemplateNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  title?: string;
  placeholder?: string;
}

export default function TemplateNameModal({
  isOpen,
  onClose,
  onSave,
  title = 'Save Template',
  placeholder = 'Enter template name',
}: TemplateNameModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
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
            >
              <X size={20} />
            </button>
          </div>

          <SystemField
            type="text"
            value={name}
            onChange={setName}
            label="Template Name"
            placeholder={placeholder}
          />

          <div className="flex justify-end gap-3 pt-2">
            <SecondaryButton onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={!name.trim()}>
              Save
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

