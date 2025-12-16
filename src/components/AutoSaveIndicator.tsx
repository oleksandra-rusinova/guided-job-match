import { CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ArcSpinner } from './Loader';

interface AutoSaveIndicatorProps {
  isSaving?: boolean;
  lastSaved?: Date | null;
  className?: string;
}

export default function AutoSaveIndicator({ isSaving = false, lastSaved, className = '' }: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving]);

  if (!isSaving && !showSaved) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-gray-500 ${className}`}>
      {isSaving ? (
        <>
          <ArcSpinner size={12} />
          <span>Saving...</span>
        </>
      ) : showSaved ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Saved</span>
        </>
      ) : null}
    </div>
  );
}

