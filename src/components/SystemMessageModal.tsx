import PrimaryButton from './PrimaryButton';

interface SystemMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  instructions?: string[];
  additionalInfo?: string;
}

export default function SystemMessageModal({
  isOpen,
  onClose,
  title,
  message,
  instructions = [],
  additionalInfo,
}: SystemMessageModalProps) {
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

            {instructions.length > 0 && (
              <div className="space-y-1">
                {instructions.map((instruction, index) => (
                  <p key={index} className="text-sm" style={{ color: '#464F5E' }}>
                    {index + 1}. {instruction}
                  </p>
                ))}
              </div>
            )}

            {additionalInfo && (
              <p className="text-sm text-gray-600 mt-2">
                {additionalInfo}
              </p>
            )}
          </div>

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

