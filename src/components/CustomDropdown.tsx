import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CustomDropdownProps {
  value: string;
  placeholder?: string;
  primaryColor: string;
  disabled?: boolean;
  options: Array<{ id: string; title?: string }>;
  onChange: (value: string) => void;
}

export default function CustomDropdown({ 
  value, 
  placeholder = 'Select an option', 
  primaryColor, 
  disabled = false, 
  options = [],
  onChange 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption ? (selectedOption.title || `Option ${selectedOption.id}`) : '';

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

  const placeholderColor = disabled ? '#9CA3AF' : '#64748B'; // gray-400 : slate-500
  const textColor = disabled ? '#9CA3AF' : (displayValue ? '#3F3F46' : '#64748B'); // gray-400 : (zinc-700 : slate-500)

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
    onChange(optionId);
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div 
      ref={dropdownRef}
      className="relative w-full"
    >
      {/* Main dropdown button */}
      <div
        onClick={handleToggle}
        className="self-stretch p-4 bg-white rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex justify-start items-center"
        style={{
          outlineColor: borderColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex-1 flex justify-start items-center">
          <div className="flex-1 justify-start text-base font-normal font-['Poppins'] leading-6 tracking-tight">
            <span
              style={{
                color: displayValue ? textColor : placeholderColor,
              }}
            >
              {displayValue || placeholder}
            </span>
          </div>
        </div>
        
        <div data-size="24px" className="w-6 h-6 relative overflow-hidden flex-shrink-0">
          {isOpen ? (
            <ChevronUp 
              size={24} 
              style={{ 
                color: disabled ? '#9CA3AF' : '#3F3F46',
              }} 
            />
          ) : (
            <ChevronDown 
              size={24} 
              style={{ 
                color: disabled ? '#9CA3AF' : '#3F3F46',
              }} 
            />
          )}
        </div>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E8EAEE',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              style={{
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: 16,
                fontFamily: 'Poppins',
                fontWeight: 200,
                lineHeight: '24px',
                letterSpacing: 0.2,
                color: '#353B46',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {option.title || `Option ${option.id}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
