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
  id: _id, 
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

  // Helper function to convert color to rgba with opacity
  const colorToRgba = (color: string, opacity: number): string => {
    const normalized = color.trim().toLowerCase();
    
    // Handle hex colors
    if (normalized.startsWith('#')) {
      const hex = normalized.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Handle rgb/rgba colors
    const rgbMatch = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return color;
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
      className={`relative w-full text-left rounded-2xl bg-white transition-all shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-offset-[-1px] ${getOutlineClasses()} flex flex-col ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ 
        height: '280px',
        outlineColor: borderColor,
        outlineWidth: `${outlineWidth}px`,
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
       <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ height: '180px' }}>
         <img
           src={imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
           alt={title}
           className="w-full h-full object-cover"
         />
         {/* Overlay when selected */}
         {selected && !disabled && (
           <div 
             className="absolute inset-0"
             style={{
               backgroundColor: colorToRgba(primaryColor, 0.2),
             }}
           />
         )}
       </div>
      
       {/* Text Content */}
       <div className="p-4 md:p-6">
         <div
           className={`text-zinc-700 text-base font-normal font-['Poppins'] leading-6 tracking-tight line-clamp-2 ${disabled ? 'text-gray-400' : ''}`}
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
