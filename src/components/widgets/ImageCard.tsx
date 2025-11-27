import { useState } from 'react';
import { Check } from 'lucide-react';

interface ImageCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  selected: boolean;
  onSelect: () => void;
  primaryColor: string;
  disabled?: boolean;
}

export default function ImageCard({ 
  id, 
  title, 
  description, 
  imageUrl, 
  selected, 
  onSelect, 
  primaryColor,
  disabled = false
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getOutlineClasses = () => {
    return '';
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

  // Determine border color based on state (matching TextField logic)
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
      className={`relative w-full text-left rounded-2xl bg-white transition-all shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] ${getOutlineClasses()} flex flex-col ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ 
        minHeight: '140px',
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

       {/* Image Container */}
       <div className="relative w-full overflow-hidden rounded-t-2xl">
         <img
           src={imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
           alt={title}
           className="w-full h-48 object-cover"
         />
       </div>
      
       {/* Text Content */}
       <div className="p-4 md:p-6">
         <div
           className={`text-gray-600 text-lg font-normal font-['Poppins'] leading-6 tracking-tight line-clamp-2 ${disabled ? 'text-gray-400' : ''}`}
           title={title || 'Option'}
         >
           {title || 'Option'}
         </div>
         {description && (
           <div
             className="text-sm leading-6 mt-2 line-clamp-2"
             style={{ color: '#6B7280', fontWeight: 400 }}
             title={description}
           >
             {description}
           </div>
         )}
       </div>
    </button>
  );
}
