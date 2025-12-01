import React, { useState } from 'react';

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  primaryColor?: string;
}

export default function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  placeholder,
  className = '',
  size = 'sm',
  showLabel = false,
  label = 'Number',
  primaryColor = '#2563EB',
}: NumberFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-8',
    md: 'w-10',
    lg: 'w-12',
  };

  const borderColor = isFocused ? primaryColor : '#E8EAEE';
  const borderWidth = isFocused ? 2 : 1;
  const boxShadow = isHovered && !disabled ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(min || 0);
      return;
    }
    
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      let clampedValue = numValue;
      if (min !== undefined) clampedValue = Math.max(clampedValue, min);
      if (max !== undefined) clampedValue = Math.min(clampedValue, max);
      onChange(clampedValue);
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div 
      className={`${className}`} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {showLabel && (
        <label
          className="block mb-2 text-left"
          style={{
            color: disabled ? '#8C95A8' : '#637085',
            fontFamily: 'var(--family-body, Poppins)',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '24px',
            letterSpacing: '0.2px',
            fontFeatureSettings: '"liga" off, "clig" off',
          }}
        >
          {label}
        </label>
      )}

      <div
        className="relative"
        style={{
          width: sizeClasses[size],
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 16,
          paddingRight: 24,
          background: 'var(--bg-default, white)',
          borderRadius: 8,
          outline: `${borderWidth}px ${borderColor} solid`,
          outlineOffset: -1,
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 4,
          display: 'inline-flex',
          boxShadow: boxShadow,
          transition: 'box-shadow 0.2s ease-in-out, outline 0.2s ease-in-out',
        }}
      >
          <input
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          placeholder={placeholder}
          className="focus:outline-none"
          style={{
            flex: '1 1 0',
            width: 12,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            textAlign: 'center',
            color: disabled ? '#8C95A8' : '#353B46',
            fontSize: 16,
            fontFamily: 'Poppins',
            fontWeight: 400,
            lineHeight: '24px',
            letterSpacing: 0.2,
            // Hide browser default spinner arrows
            MozAppearance: 'textfield',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
        
        {/* Custom increment/decrement buttons */}
        <div className="absolute right-1 top-0 bottom-0 flex flex-col">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && value >= max)}
            className="
              flex-1 flex items-center justify-center
              w-4 h-1/2 text-gray-500 hover:text-gray-700
              disabled:text-gray-300 disabled:cursor-not-allowed
              transition-colors duration-150
            "
            aria-label="Increment"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            </button>
            
            <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && value <= min)}
            className="
              flex-1 flex items-center justify-center
              w-4 h-1/2 text-gray-500 hover:text-gray-700
              disabled:text-gray-300 disabled:cursor-not-allowed
               transition-colors duration-150
            "
            aria-label="Decrement"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
