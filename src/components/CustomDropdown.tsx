import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import Checkbox from './Checkbox';

interface CustomDropdownProps {
  value: string | string[];
  placeholder?: string;
  primaryColor: string;
  disabled?: boolean;
  options: Array<{ id: string; title?: string }>;
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  maxSelection?: number;
}

export default function CustomDropdown({ 
  value, 
  placeholder = 'Select an option', 
  primaryColor, 
  disabled = false, 
  options = [],
  onChange,
  multiSelect = false,
  maxSelection
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize value to array for multi-select, or single string for single-select
  const selectedValues = multiSelect 
    ? (Array.isArray(value) ? value : (typeof value === 'string' && value ? [value] : []))
    : [];
  const singleValue = multiSelect ? '' : (typeof value === 'string' ? value : '');

  const selectedOptions = options.filter(opt => 
    multiSelect ? selectedValues.includes(opt.id) : opt.id === singleValue
  );

  // Determine border color based on state (matching TextField)
  let borderColor: string;
  if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
  } else if (isFocused || isOpen) {
    borderColor = '#9CA3AF'; // gray-400
  } else if (isHovered) {
    borderColor = '#9CA3AF'; // gray-400
  } else {
    borderColor = '#E5E7EB'; // gray-200
  }

  // Placeholder color is always consistent regardless of label state
  const placeholderColor = disabled ? '#9CA3AF' : '#64748B'; // gray-400 : slate-500
  const textColor = disabled ? '#9CA3AF' : '#3F3F46'; // gray-400 : zinc-700
  
  // Placeholder typography - always consistent
  const placeholderTypography = {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: 0.2,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setIsFocused(!isOpen);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (multiSelect) {
      const isSelected = selectedValues.includes(optionId);
      if (isSelected) {
        // Remove from selection
        const newValues = selectedValues.filter(id => id !== optionId);
        onChange(newValues);
      } else {
        // Add to selection if under max limit
        // Treat maxSelection >= options.length as unlimited (no limit)
        const isUnlimited = maxSelection && maxSelection >= options.length;
        if (!maxSelection || isUnlimited || selectedValues.length < maxSelection) {
          const newValues = [...selectedValues, optionId];
          onChange(newValues);
        }
      }
      // Don't close dropdown in multi-select mode
    } else {
      onChange(optionId);
      setIsOpen(false);
      setIsFocused(false);
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiSelect) {
      onChange([]);
    } else {
      onChange('');
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    if (multiSelect) {
      const newValues = selectedValues.filter(id => id !== optionId);
      onChange(newValues);
    }
  };

  const isOptionSelected = (optionId: string) => {
    return multiSelect ? selectedValues.includes(optionId) : optionId === singleValue;
  };

  const isOptionDisabled = (optionId: string) => {
    if (multiSelect && maxSelection) {
      // Treat maxSelection >= options.length as unlimited (no limit)
      const isUnlimited = maxSelection >= options.length;
      if (isUnlimited) {
        return false; // Never disable options when unlimited
      }
      return !isOptionSelected(optionId) && selectedValues.length >= maxSelection;
    }
    return false;
  };

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div 
      ref={dropdownRef}
      className="relative w-full"
    >
      {/* Main dropdown button */}
      <div
        onClick={handleToggle}
        className="self-stretch bg-white rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex justify-start items-center gap-2"
        style={{
          outlineColor: borderColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
          height: '56px',
          padding: '12px 16px',
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex-1 flex justify-start items-center gap-2 overflow-x-auto overflow-y-hidden" style={{ minWidth: 0 }}>
          {multiSelect && selectedOptions.length > 0 ? (
            // Show tags/chips for multi-select
            selectedOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 flex-shrink-0"
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins',
                  fontWeight: 100,
                  lineHeight: '20px',
                  letterSpacing: 0.2,
                  color: '#353B46',
                }}
              >
                <span className="whitespace-nowrap">{option.title || `Option ${option.id}`}</span>
                <button
                  onClick={(e) => handleRemoveTag(e, option.id)}
                  className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                  style={{ color: '#353B46' }}
                >
                  <X size={10} />
                </button>
              </div>
            ))
          ) : multiSelect ? (
            // Show placeholder when no selections
            <span
              style={{
                color: placeholderColor,
                ...placeholderTypography,
              }}
            >
              {placeholder}
            </span>
          ) : (
            // Single select display
            <span
              style={{
                color: selectedOptions.length > 0 ? textColor : placeholderColor,
                ...placeholderTypography,
              }}
            >
              {selectedOptions.length > 0 
                ? (selectedOptions[0].title || `Option ${selectedOptions[0].id}`)
                : placeholder}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {multiSelect && selectedOptions.length > 0 && (
            <div data-size="16px" className="w-6 h-6 relative overflow-hidden flex-shrink-0">
              <button
                onClick={handleClearAll}
                className="flex items-center justify-center w-full h-full rounded hover:bg-gray-100 transition-colors"
                style={{ color: disabled ? '#9CA3AF' : '#3F3F46' }}
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div data-size="16px" className="w-6 h-6 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
            {isOpen ? (
              <ChevronUp 
                size={20} 
                style={{ 
                  color: disabled ? '#9CA3AF' : '#3F3F46',
                }} 
              />
            ) : (
              <ChevronDown 
                size={20} 
                style={{ 
                  color: disabled ? '#9CA3AF' : '#3F3F46',
                }} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: 'calc(100% + 4px)',
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E8EAEE',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => {
            const isSelected = isOptionSelected(option.id);
            const isDisabled = isOptionDisabled(option.id);
            const optionBgColor = isSelected ? hexToRgba(primaryColor, 0.1) : 'transparent';
            const optionTextColor = isSelected ? primaryColor : '#353B46';
            const hoverBgColor = isSelected ? hexToRgba(primaryColor, 0.15) : '#F3F4F6';
            
            return (
              <div
                key={option.id}
                onClick={(e) => {
                  // Don't handle click if it's on the checkbox area (multi-select mode)
                  if (multiSelect && (e.target as HTMLElement).closest('.flex-shrink-0')) {
                    return;
                  }
                  if (!isDisabled) {
                    handleOptionSelect(option.id);
                  }
                }}
                style={{
                  padding: '12px 24px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontFamily: 'Poppins',
                  fontWeight: 200,
                  lineHeight: '24px',
                  letterSpacing: 0.2,
                  color: isDisabled ? '#9CA3AF' : optionTextColor,
                  backgroundColor: isSelected ? optionBgColor : 'transparent',
                  transition: 'background-color 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = hoverBgColor;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? optionBgColor : 'transparent';
                }}
              >
                {multiSelect && (
                  <div 
                    className="flex-shrink-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (!isDisabled) {
                          handleOptionSelect(option.id);
                        }
                      }}
                      primaryColor={primaryColor}
                      useBrandColor={true}
                      size="md"
                    />
                  </div>
                )}
                <span className="flex-1" style={{ display: 'flex', alignItems: 'center' }}>
                  {option.title || `Option ${option.id}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
