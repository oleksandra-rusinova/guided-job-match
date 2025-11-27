import { useState } from 'react';
import { Check } from 'lucide-react';

interface AdvancedCardProps {
  id: string;
  heading: string;
  mainText?: string;
  linkSupportingText?: string;
  linkEnabled?: boolean;
  linkUrl?: string;
  linkText?: string;
  selected: boolean;
  onSelect: () => void;
  primaryColor: string;
  disabled?: boolean;
}

export default function AdvancedCard({
  id,
  heading,
  mainText,
  linkSupportingText,
  linkEnabled = false,
  linkUrl,
  linkText = 'Learn more',
  selected,
  onSelect,
  primaryColor,
  disabled = false
}: AdvancedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getIndicatorState = () => {
    if (disabled) {
      return 'Disabled';
    }
    if (selected) {
      return 'Selected';
    }
    return 'Default';
  };

  // Determine border color based on state
  let borderColor: string;
  if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
  } else if (selected) {
    borderColor = primaryColor || '#4F46E5'; // indigo-600
  } else if (isHovered) {
    borderColor = '#AEB5C2'; // gray-400
  } else {
    borderColor = '#E8EAEE'; // gray-200
  }

  // Text color based on state
  const textColor = disabled ? 'text-gray-400' : 'text-gray-600';
  const linkTextColor = disabled 
    ? 'text-gray-400' 
    : 'text-blue-600';

  // Fixed size classes (Big size)
  const headingColorClass = disabled ? 'text-gray-400' : 'text-gray-600';
  const mainTextColorClass = disabled ? 'text-gray-400' : 'text-gray-600';
  const linkSizeClass = 'text-sm font-medium leading-5 tracking-tight';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full text-left rounded-2xl bg-[var(--bg-default,white)] shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex flex-col transition-all ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        outlineColor: borderColor,
      }}
    >
      {/* Selection Indicator */}
      <div className="absolute left-[16px] top-[16px] z-10">
        <div
          data-state={getIndicatorState()}
          className={`w-6 h-6 rounded-[100px] flex items-center justify-center ${
            selected 
              ? 'outline outline-2 outline-white' 
              : 'border'
          }`}
          style={{
            borderColor: disabled ? '#E5E7EB' : (selected ? 'transparent' : '#D1D5DB'),
            backgroundColor: selected ? (primaryColor || '#4F46E5') : '#FFFFFF',
          }}
        >
          {selected && (
            <div className="h-4 min-w-3 inline-flex flex-col justify-center items-center gap-1.5 overflow-hidden">
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-[64px] pb-4 pr-4 pl-4 flex-1 inline-flex flex-col justify-start items-start">
        <div className="self-stretch flex flex-col justify-start items-start gap-4">
          {/* Heading */}
          <div className="self-stretch inline-flex justify-start items-center gap-2.5">
            <div className={`text-center justify-start ${headingColorClass} text-xl font-semibold font-['Poppins'] leading-8`}>
              {heading || 'Heading'}
            </div>
          </div>

          {/* Main Text and Link */}
          <div className="self-stretch flex flex-col justify-start items-start">
            {mainText && (
              <div className={`self-stretch max-h-12 text-left justify-start ${mainTextColorClass} text-sm font-normal font-['Poppins'] leading-6 tracking-tight line-clamp-2`}>
                {mainText}
              </div>
            )}

            {linkEnabled && linkSupportingText && (
              <div className="self-stretch inline-flex justify-start items-center gap-1">
                <div className={`justify-start ${mainTextColorClass} text-sm font-normal font-['Poppins'] leading-6 tracking-tight`}>
                  {linkSupportingText}
                </div>
                <div
                  data-show-icon="false"
                  data-size="Big"
                  data-state={disabled ? 'Disabled' : 'Default'}
                  data-type="Primary"
                  data-weight="Medium"
                  className="flex-1 flex justify-start items-center gap-2"
                >
                  <div className={`justify-center ${linkTextColor} ${linkSizeClass} font-['Poppins']`}>
                    {linkText}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

