import { useState } from 'react';
import { Check } from 'lucide-react';

interface SimpleCardProps {
  title: string;
  selected: boolean;
  onSelect: () => void;
  primaryColor: string;
  disabled?: boolean;
}

export default function SimpleCard({ title, selected, onSelect, primaryColor, disabled = false }: SimpleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getOutlineClasses = () => {
    if (disabled) {
      return 'outline-gray-200';
    }
    if (selected) {
      return 'outline-offset-[-1px]';
    }
    return 'outline-gray-200';
  };

  const getIndicatorState = () => {
    if (disabled) {
      return 'Disabled';
    }
    if (selected) {
      return 'Selected';
    }
    return 'Default';
  };

  // Determine border color and width based on state
  let borderColor: string;
  let outlineWidth: number;
  if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
    outlineWidth = 1;
  } else if (selected && isHovered) {
    borderColor = primaryColor;
    outlineWidth = 3; // 3px stroke on hover+selected
  } else if (selected) {
    borderColor = primaryColor;
    outlineWidth = 2; // 2px stroke when selected
  } else if (isHovered) {
    borderColor = '#9CA3AF'; // gray-400
    outlineWidth = 1; // 1px stroke on hover
  } else {
    borderColor = '#E5E7EB'; // gray-200
    outlineWidth = 1;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full min-h-32 p-4 relative bg-[var(--bg-default,white)] rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-offset-[-1px] ${getOutlineClasses()} flex justify-start items-end gap-2.5 transition-all ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        outlineColor: borderColor,
        outlineWidth: `${outlineWidth}px`,
      }}
    >
      <div className="flex-1 max-h-14 flex justify-start items-end gap-2.5">
        <div className={`flex-1 max-h-14 text-left text-gray-600 text-lg font-normal font-['Poppins'] leading-6 tracking-tight ${disabled ? 'text-gray-400' : ''}`}>
          {title || 'Option'}
        </div>
      </div>

      <div
        data-state={getIndicatorState()}
        className={`w-6 h-6 left-[16px] top-[16px] absolute rounded-[100px] flex items-center justify-center ${
          selected 
            ? 'outline outline-2 outline-white' 
            : 'border'
        }`}
        style={{
          borderColor: disabled ? '#E5E7EB' : (selected ? 'transparent' : '#D1D5DB'),
          backgroundColor: selected ? primaryColor : 'var(--bg-default, #FFFFFF)',
        }}
      >
        {selected && (
          <div className="h-4 min-w-3 inline-flex flex-col justify-center items-center gap-1.5 overflow-hidden">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}


