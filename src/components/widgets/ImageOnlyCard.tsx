import { useState } from 'react';
import { Check } from 'lucide-react';

interface ImageOnlyCardProps {
  id: string;
  imageUrl: string;
  selected: boolean;
  onSelect: () => void;
  primaryColor: string;
  totalCards?: number; // Total number of cards in the grid
  disabled?: boolean;
}

export default function ImageOnlyCard({ 
  id: _id, 
  imageUrl, 
  selected, 
  onSelect, 
  primaryColor,
  totalCards = 1,
  disabled = false
}: ImageOnlyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // When there are exactly 4 cards, use fixed aspect ratio sizing
  const isFourCards = totalCards === 4;

  const getIndicatorState = () => {
    if (disabled) {
      return 'Disabled';
    }
    if (selected) {
      return 'Selected';
    }
    return 'Default';
  };

  // Determine border color based on state (matching other cards)
  let borderColor: string;
  if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
  } else if (selected) {
    borderColor = primaryColor;
  } else if (isHovered) {
    borderColor = '#9CA3AF'; // gray-400
  } else {
    borderColor = '#E5E7EB'; // gray-200
  }
  
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full text-left rounded-2xl bg-white transition-all shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex flex-col p-[1px] ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ 
        minHeight: isFourCards ? 'auto' : '280px',
        height: isFourCards ? '100%' : 'auto',
        maxHeight: isFourCards ? '280px' : undefined,
        aspectRatio: isFourCards ? '1 / 1' : undefined,
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
            backgroundColor: selected ? primaryColor : '#FFFFFF',
          }}
        >
          {selected && (
            <div className="h-4 min-w-3 inline-flex flex-col justify-center items-center gap-1.5 overflow-hidden">
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

       {/* Image Container - Takes full height */}
       <div className={`relative w-full ${isFourCards ? 'h-full' : 'h-1/2 flex-1'} overflow-hidden rounded-[15px]`}>
         <img
           src={imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
           alt="Card image"
           className="w-full h-full object-cover"
         />
       </div>
    </button>
  );
}
