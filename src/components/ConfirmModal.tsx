import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonColor,
}: ConfirmModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
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

          <div className="flex justify-end gap-3 pt-2">
            <SecondaryButton onClick={handleCancel}>
              {cancelText}
            </SecondaryButton>
            <PrimaryButton onClick={handleConfirm} primaryColor={confirmButtonColor}>
              {confirmText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

