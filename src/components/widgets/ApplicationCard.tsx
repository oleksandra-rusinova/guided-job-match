import { useState } from 'react';
import TextButton from '../TextButton';
import IconButton from '../IconButton';
import Tooltip from '../Tooltip';

interface ApplicationCardProps {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  primaryColor: string;
  disabled?: boolean;
  jobTitle?: string;
  location?: string;
  department?: string;
  jobType?: string;
  jobId?: string;
  jobDescription?: string;
  primaryButtonLink?: string;
  learnMoreButtonLink?: string;
}

export default function ApplicationCard({ 
  id: _id, 
  title, 
  description, 
  imageUrl,
  primaryColor,
  disabled = false,
  jobTitle,
  location,
  department,
  jobType,
  jobId,
  jobDescription,
  primaryButtonLink,
  learnMoreButtonLink
}: ApplicationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isApplyButtonHovered, setIsApplyButtonHovered] = useState(false);

  // Helper function to darken color for hover state
  const getHoverColor = (color: string) => {
    const normalized = color.trim().toLowerCase();
    
    // Handle hex colors
    if (normalized.startsWith('#')) {
      const hex = normalized.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const hoverR = Math.max(0, Math.floor(r * 0.85));
      const hoverG = Math.max(0, Math.floor(g * 0.85));
      const hoverB = Math.max(0, Math.floor(b * 0.85));
      return `rgb(${hoverR}, ${hoverG}, ${hoverB})`;
    }
    
    // Handle rgb/rgba colors
    const rgbMatch = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const hoverR = Math.max(0, Math.floor(r * 0.85));
      const hoverG = Math.max(0, Math.floor(g * 0.85));
      const hoverB = Math.max(0, Math.floor(b * 0.85));
      return `rgb(${hoverR}, ${hoverG}, ${hoverB})`;
    }
    
    return color;
  };

  // getIndicatorState is computed but not used - keeping for potential future use
  // const getIndicatorState = () => {
  //   if (disabled) {
  //     return 'Disabled';
  //   }
  //   if (selected) {
  //     return 'Selected';
  //   }
  //   return 'Default';
  // };

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
  // Note: ApplicationCard doesn't have a selected state, so we only handle hover
  let borderColor: string;
  let outlineWidth: number;
  if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
    outlineWidth = 1;
  } else if (isHovered) {
    borderColor = '#9CA3AF'; // gray-400
    outlineWidth = 1; // 1px stroke on hover
  } else {
    borderColor = '#E5E7EB'; // gray-200
    outlineWidth = 1;
  }

  // Text color based on state (matching other cards)
  const titleColorClass = disabled ? 'text-gray-400' : 'text-zinc-700';
  const detailTextColor = disabled ? '#9CA3AF' : 'rgba(99, 112, 133, 1)';
  const descriptionTextColor = disabled ? '#9CA3AF' : 'rgba(99, 112, 133, 1)';

  // Use new fields if available, fallback to old fields for backward compatibility
  // For placeholder purposes, show empty string when no title is provided
  const displayTitle = jobTitle || title || '';
  const displayDescription = jobDescription || description;

  return (
    <div
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full text-left rounded-2xl bg-white transition-all shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] border flex flex-col ${
        disabled ? 'cursor-not-allowed' : 'cursor-default'
      }`}
      style={{ 
        borderColor: borderColor,
        borderWidth: `${outlineWidth}px`,
        height: '412px',
      }}
    >
      {/* Favorite Button */}
      <div className="absolute top-4 right-4 z-10">
        <Tooltip content={isFavorited ? "Remove from favorites" : "Add to favorites"}>
          <IconButton
            icon={
              isFavorited ? (
                <svg width="25" height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.3105 1C13.1702 1 13.959 1.4887 14.335 2.26562L16.6152 6.95801L21.707 7.70996H21.709C22.5532 7.8366 23.2487 8.42842 23.5146 9.2334C23.7662 9.99501 23.5884 10.8268 23.0674 11.4199L22.959 11.5352L19.2578 15.1963L20.1367 20.376V20.3789C20.2777 21.2253 19.9246 22.0728 19.2354 22.5742C18.5331 23.0849 17.6108 23.1368 16.8594 22.7402L16.8555 22.7373L12.3145 20.3125L7.77441 22.7373L7.76953 22.7402C7.01274 23.1395 6.0942 23.0764 5.39941 22.5781C4.70155 22.0774 4.35194 21.2212 4.49219 20.3789L4.49316 20.377L5.36719 15.1973L1.66602 11.5352C1.05731 10.9333 0.850513 10.0418 1.1084 9.24023C1.37112 8.42393 2.07741 7.83586 2.91602 7.70996H2.91895L8.00488 6.95898L10.2861 2.26562L10.2881 2.2627C10.6653 1.49424 11.4449 1.0001 12.3105 1Z" fill="#F8BA4B" stroke="white" strokeWidth="2"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.3083 0C11.6676 0 11.9958 0.203125 12.152 0.527344L14.8317 6.04688L20.8161 6.92969C21.1676 6.98047 21.4606 7.22656 21.57 7.56641C21.6794 7.90625 21.5895 8.27344 21.3395 8.52344L16.9997 12.8281L18.0231 18.9062C18.0817 19.2578 17.9372 19.6133 17.6442 19.8242C17.3512 20.0352 16.9684 20.0586 16.6559 19.8906L11.3044 17.0312L5.96062 19.8867C5.64421 20.0547 5.2614 20.0312 4.97234 19.8203C4.68327 19.6094 4.53484 19.2539 4.59343 18.9023L5.61687 12.8242L1.27702 8.52344C1.02312 8.27344 0.937181 7.90234 1.04656 7.56641C1.15593 7.23047 1.4489 6.98437 1.80046 6.92969L7.78484 6.04688L10.4645 0.527344C10.6247 0.203125 10.9489 0 11.3083 0ZM11.3083 3.08594L9.25749 7.3125C9.12077 7.58984 8.85906 7.78516 8.55046 7.83203L3.92937 8.51172L7.28484 11.8359C7.49968 12.0508 7.60124 12.3555 7.55046 12.6562L6.75749 17.332L10.8669 15.1367C11.1442 14.9883 11.4762 14.9883 11.7497 15.1367L15.8591 17.332L15.07 12.6602C15.0192 12.3594 15.1169 12.0547 15.3356 11.8398L18.6911 8.51562L14.07 7.83203C13.7653 7.78516 13.4997 7.59375 13.363 7.3125L11.3083 3.08594Z" fill="#637085"/>
                </svg>
              )
            }
            variant="ghost"
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
          />
        </Tooltip>
      </div>

      {/* Image Container (if imageUrl provided) */}
      {imageUrl && (
        <div className="relative w-full overflow-hidden rounded-t-2xl">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-48 object-cover"
          />
          {/* Note: ApplicationCard doesn't have selected state, so no overlay needed */}
        </div>
      )}
      
      {/* Content */}
      <div className="w-full flex flex-col flex-1" style={{ 
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '24px',
        paddingTop: '24px'
      }}>
        <div className="flex flex-col gap-4 flex-1">
          {/* Header with Job Title - Always show as placeholder */}
          <div className="self-stretch inline-flex justify-start items-start gap-2.5" style={{ height: '60px' }}>
            <div className={`flex-1 text-left ${titleColorClass} text-xl font-semibold font-['Poppins'] leading-8 line-clamp-2`}>
              {displayTitle || '\u00A0'}
            </div>
          </div>

          {/* Details List - Always show icons as placeholders in prototype view */}
          <div className="self-stretch flex flex-col justify-start items-start" style={{ gap: '8px' }}>
            {/* Location */}
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="relative overflow-hidden flex-shrink-0" style={{ width: '18px', height: '18px', flex: 'none', order: 0, flexGrow: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 9C9.4125 9 9.76575 8.853 10.0598 8.559C10.3533 8.2655 10.5 7.9125 10.5 7.5C10.5 7.0875 10.3533 6.73425 10.0598 6.44025C9.76575 6.14675 9.4125 6 9 6C8.5875 6 8.2345 6.14675 7.941 6.44025C7.647 6.73425 7.5 7.0875 7.5 7.5C7.5 7.9125 7.647 8.2655 7.941 8.559C8.2345 8.853 8.5875 9 9 9ZM9 14.5125C10.525 13.1125 11.6562 11.8405 12.3937 10.6965C13.1312 9.553 13.5 8.5375 13.5 7.65C13.5 6.2875 13.0655 5.17175 12.1965 4.30275C11.328 3.43425 10.2625 3 9 3C7.7375 3 6.67175 3.43425 5.80275 4.30275C4.93425 5.17175 4.5 6.2875 4.5 7.65C4.5 8.5375 4.86875 9.553 5.60625 10.6965C6.34375 11.8405 7.475 13.1125 9 14.5125ZM9 16.2188C8.9 16.2188 8.8 16.2 8.7 16.1625C8.6 16.125 8.5125 16.075 8.4375 16.0125C6.6125 14.4 5.25 12.9032 4.35 11.5223C3.45 10.1407 3 8.85 3 7.65C3 5.775 3.60325 4.28125 4.80975 3.16875C6.01575 2.05625 7.4125 1.5 9 1.5C10.5875 1.5 11.9843 2.05625 13.1903 3.16875C14.3967 4.28125 15 5.775 15 7.65C15 8.85 14.55 10.1407 13.65 11.5223C12.75 12.9032 11.3875 14.4 9.5625 16.0125C9.4875 16.075 9.4 16.125 9.3 16.1625C9.2 16.2 9.1 16.2188 9 16.2188Z" fill={detailTextColor}/>
                </svg>
              </div>
              <div className="flex-1 h-6 justify-start text-sm font-normal font-['Poppins'] leading-6 tracking-tight" style={{ color: detailTextColor }}>
                {location || '\u00A0'}
              </div>
            </div>

            {/* Department */}
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="relative overflow-hidden flex-shrink-0" style={{ width: '18px', height: '18px', flex: 'none', order: 0, flexGrow: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 4.5V3H7.50003V4.5H10.5ZM3.00003 6.75V13.5C3.00262 13.6981 3.08247 13.8874 3.22257 14.0275C3.36266 14.1676 3.55193 14.2474 3.75003 14.25H14.25C14.4481 14.2474 14.6374 14.1676 14.7775 14.0275C14.9176 13.8874 14.9974 13.6981 15 13.5V6.75C14.9974 6.55189 14.9176 6.36263 14.7775 6.22253C14.6374 6.08244 14.4481 6.00259 14.25 6H3.75003C3.55193 6.00259 3.36266 6.08244 3.22257 6.22253C3.08247 6.36263 3.00262 6.55189 3.00003 6.75ZM15 4.5C15.3979 4.5 15.7794 4.65804 16.0607 4.93934C16.342 5.22064 16.5 5.60218 16.5 6V14.25C16.5 14.6478 16.342 15.0294 16.0607 15.3107C15.7794 15.592 15.3979 15.75 15 15.75H3.00003C2.60221 15.75 2.22068 15.592 1.93937 15.3107C1.65807 15.0294 1.50003 14.6478 1.50003 14.25V6C1.4987 5.80265 1.5366 5.60699 1.61151 5.42441C1.68642 5.24182 1.79686 5.07593 1.93641 4.93638C2.07596 4.79682 2.24185 4.68638 2.42444 4.61147C2.60703 4.53656 2.80268 4.49867 3.00003 4.5H6.00003V3C6.00003 2.60218 6.15807 2.22064 6.43937 1.93934C6.72068 1.65804 7.10221 1.5 7.50003 1.5H10.5C10.8979 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5H15Z" fill={detailTextColor}/>
                </svg>
              </div>
              <div className="flex-1 h-6 justify-start text-sm font-normal font-['Poppins'] leading-6 tracking-tight" style={{ color: detailTextColor }}>
                {department || '\u00A0'}
              </div>
            </div>

            {/* Job Type */}
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="relative overflow-hidden flex-shrink-0" style={{ width: '18px', height: '18px', flex: 'none', order: 0, flexGrow: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.75 12.375C6.225 12.375 5.78125 12.1937 5.41875 11.8312C5.05625 11.4688 4.875 11.025 4.875 10.5C4.875 9.975 5.05625 9.53125 5.41875 9.16875C5.78125 8.80625 6.225 8.625 6.75 8.625C7.275 8.625 7.71875 8.80625 8.08125 9.16875C8.44375 9.53125 8.625 9.975 8.625 10.5C8.625 11.025 8.44375 11.4688 8.08125 11.8312C7.71875 12.1937 7.275 12.375 6.75 12.375ZM3.75 16.5C3.3375 16.5 2.98425 16.3533 2.69025 16.0597C2.39675 15.7657 2.25 15.4125 2.25 15V4.5C2.25 4.0875 2.39675 3.7345 2.69025 3.441C2.98425 3.147 3.3375 3 3.75 3H4.5V2.25C4.5 2.0375 4.57175 1.85925 4.71525 1.71525C4.85925 1.57175 5.0375 1.5 5.25 1.5C5.4625 1.5 5.64075 1.57175 5.78475 1.71525C5.92825 1.85925 6 2.0375 6 2.25V3H12V2.25C12 2.0375 12.072 1.85925 12.216 1.71525C12.3595 1.57175 12.5375 1.5 12.75 1.5C12.9625 1.5 13.1405 1.57175 13.284 1.71525C13.428 1.85925 13.5 2.0375 13.5 2.25V3H14.25C14.6625 3 15.0157 3.147 15.3097 3.441C15.6033 3.7345 15.75 4.0875 15.75 4.5V15C15.75 15.4125 15.6033 15.7657 15.3097 16.0597C15.0157 16.3533 14.6625 16.5 14.25 16.5H3.75ZM3.75 15H14.25V7.5H3.75V15ZM3.75 6H14.25V4.5H3.75V6ZM3.75 6V4.5V6Z" fill={detailTextColor}/>
                </svg>
              </div>
              <div className="flex-1 justify-start text-sm font-normal font-['Poppins'] leading-6 tracking-tight line-clamp-1" style={{ color: detailTextColor }}>
                {jobType || '\u00A0'}
              </div>
            </div>

            {/* Job ID */}
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="relative flex-shrink-0" style={{ width: '18px', height: '18px', flex: 'none', order: 0, flexGrow: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.2125 9.52481L7.1625 8.4748C7.0125 8.32481 6.8375 8.2498 6.6375 8.2498C6.4375 8.2498 6.2625 8.32481 6.1125 8.4748C5.9625 8.6248 5.8875 8.80293 5.8875 9.00918C5.8875 9.21543 5.9625 9.39355 6.1125 9.54355L7.6875 11.1373C7.8375 11.2873 8.0125 11.3623 8.2125 11.3623C8.4125 11.3623 8.5875 11.2873 8.7375 11.1373L11.925 7.9498C12.075 7.7998 12.15 7.62168 12.15 7.41543C12.15 7.20918 12.075 7.03105 11.925 6.88105C11.775 6.73105 11.5969 6.65605 11.3906 6.65605C11.1844 6.65605 11.0063 6.73105 10.8563 6.88105L8.2125 9.52481ZM9 16.4248C8.9125 16.4248 8.83125 16.4186 8.75625 16.4061C8.68125 16.3936 8.60625 16.3748 8.53125 16.3498C6.84375 15.7873 5.5 14.7467 4.5 13.2279C3.5 11.7092 3 10.0748 3 8.3248V4.78105C3 4.46855 3.09063 4.1873 3.27188 3.9373C3.45312 3.6873 3.6875 3.50605 3.975 3.39355L8.475 1.70605C8.65 1.64355 8.825 1.6123 9 1.6123C9.175 1.6123 9.35 1.64355 9.525 1.70605L14.025 3.39355C14.3125 3.50605 14.5469 3.6873 14.7281 3.9373C14.9094 4.1873 15 4.46855 15 4.78105V8.3248C15 10.0748 14.5 11.7092 13.5 13.2279C12.5 14.7467 11.1562 15.7873 9.46875 16.3498C9.39375 16.3748 9.31875 16.3936 9.24375 16.4061C9.16875 16.4186 9.0875 16.4248 9 16.4248ZM9 14.9248C10.3 14.5123 11.375 13.6873 12.225 12.4498C13.075 11.2123 13.5 9.8373 13.5 8.3248V4.78105L9 3.09355L4.5 4.78105V8.3248C4.5 9.8373 4.925 11.2123 5.775 12.4498C6.625 13.6873 7.7 14.5123 9 14.9248Z" fill={detailTextColor}/>
                </svg>
              </div>
              <div className="flex-1 justify-start text-sm font-normal font-['Poppins'] leading-6 tracking-tight line-clamp-1" style={{ color: detailTextColor }}>
                {jobId || '\u00A0'}
              </div>
            </div>
          </div>

          {/* Job Description - Always show as placeholder */}
          <div className="self-stretch text-left text-sm font-normal font-['Poppins'] leading-6 tracking-tight overflow-y-auto" style={{ color: descriptionTextColor, height: '104px', minHeight: '104px' }}>
            {displayDescription || '\u00A0'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="self-stretch flex justify-start items-center" style={{ gap: '24px', marginTop: 'auto' }}>
          <div className="flex-shrink-0">
            {learnMoreButtonLink ? (
              <a
                href={learnMoreButtonLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block"
              >
                <TextButton disabled={disabled} size="md" primaryColor={primaryColor}>
                  View details
                </TextButton>
              </a>
            ) : (
              <TextButton disabled={disabled} size="md" primaryColor={primaryColor}>
                View details
              </TextButton>
            )}
          </div>
          {primaryButtonLink ? (
            <a
              href={primaryButtonLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1"
            >
              <div 
                className={`px-4 py-2.5 rounded-[10px] flex justify-center items-center gap-2 transition-all duration-200 ${disabled ? 'bg-gray-100' : 'cursor-pointer'}`}
                style={{ 
                  backgroundColor: disabled 
                    ? '#F3F4F6' 
                    : (isHovered || isApplyButtonHovered) 
                      ? getHoverColor(primaryColor) 
                      : primaryColor 
                }}
                onMouseEnter={() => !disabled && setIsApplyButtonHovered(true)}
                onMouseLeave={() => setIsApplyButtonHovered(false)}
              >
                <div className={`justify-center text-sm font-medium font-['Poppins'] leading-5 tracking-tight`} style={{ color: disabled ? '#9CA3AF' : '#FFFFFF' }}>
                  Apply
                </div>
              </div>
            </a>
          ) : (
            <div 
              className={`flex-1 px-4 py-2.5 rounded-[10px] flex justify-center items-center gap-2 transition-all duration-200 ${disabled ? 'bg-gray-100' : 'cursor-pointer'}`}
              style={{ 
                backgroundColor: disabled 
                  ? '#F3F4F6' 
                  : (isHovered || isApplyButtonHovered) 
                    ? getHoverColor(primaryColor) 
                    : primaryColor 
              }}
              onMouseEnter={() => !disabled && setIsApplyButtonHovered(true)}
              onMouseLeave={() => setIsApplyButtonHovered(false)}
            >
              <div className={`justify-center text-sm font-medium font-['Poppins'] leading-5 tracking-tight`} style={{ color: disabled ? '#9CA3AF' : '#FFFFFF' }}>
                Apply
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

