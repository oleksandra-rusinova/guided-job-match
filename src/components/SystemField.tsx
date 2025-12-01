import React, { useState, useRef, useEffect } from 'react';
import { Link as LinkIcon, ChevronDown } from 'lucide-react';

interface SystemFieldProps {
  type?: 'text' | 'textarea' | 'url' | 'dropdown';
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  showLabel?: boolean;
  options?: Array<{ id: string; title?: string }>;
}

export default function SystemField({
  type = 'text',
  value,
  onChange,
  label,
  placeholder = '',
  disabled = false,
  className = '',
  rows = 3,
  showLabel = true,
  options = []
}: SystemFieldProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const baseClasses = "w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none hover:shadow-md transition-all duration-200";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "";
  const labelClasses = "block text-sm font-medium mb-2";
  const labelStyle = { color: '#464F5E' };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsFocused(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleDropdownSelect = (optionId: string) => {
    onChange(optionId);
    setIsDropdownOpen(false);
    setIsFocused(false);
  };

  const renderField = () => {
    if (type === 'url') {
      return (
        <div className="relative">
          <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            className={`${baseClasses} pl-10 pr-4 ${disabledClasses} ${className}`}
          />
        </div>
      );
    }

    if (type === 'textarea') {
      // Calculate max-height based on rows to ensure scrollbar appears when content exceeds
      // Approximate: line-height ~1.5rem (24px) per row + padding (py-2 = 16px total)
      const maxHeight = `${rows * 1.5 + 0.5}rem`; // rows * line-height + padding
      
      return (
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          style={{ maxHeight, minHeight: `${rows * 1.5 + 0.5}rem` }}
          className={`${baseClasses} resize-none overflow-y-auto ${disabledClasses} ${className}`}
        />
      );
    }

    if (type === 'dropdown') {
      const selectedOption = options.find(opt => opt.id === value);
      const displayValue = selectedOption ? (selectedOption.title || `Option ${selectedOption.id}`) : '';
      
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !isDropdownOpen && setIsFocused(false)}
            disabled={disabled}
            className={`${baseClasses} pr-10 appearance-none cursor-pointer text-left ${disabledClasses} ${className}`}
            style={{
              color: displayValue ? '#111827' : '#9CA3AF'
            }}
          >
            {displayValue || placeholder}
            <ChevronDown 
              size={20} 
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: disabled ? '#9CA3AF' : '#6B7280' }}
            />
          </button>
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div 
                className="absolute left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                style={{ top: 'calc(100% + 4px)' }}
              >
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleDropdownSelect(option.id)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                    style={{ color: '#464F5E' }}
                  >
                    {option.title || `Option ${option.id}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
        className={`${baseClasses} ${disabledClasses} ${className}`}
      />
    );
  };

  return (
    <div>
      {showLabel && label && (
        <label className={labelClasses} style={labelStyle}>
          {label}
        </label>
      )}
      {renderField()}
    </div>
  );
}
