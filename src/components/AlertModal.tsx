import PrimaryButton from './PrimaryButton';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
}: AlertModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Get the origin/hostname for the title if not provided
  const defaultTitle = title || `Message from ${window.location.hostname || 'localhost'}`;

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
              {defaultTitle}
            </h3>
          </div>

          <div className="space-y-3">
            <p className="text-sm" style={{ color: '#464F5E' }}>
              {message}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <PrimaryButton onClick={onClose}>
              {buttonText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

