import React, { useState } from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  primaryColor?: string;
}

export default function PrimaryButton({ 
  children, 
  icon,
  className = '', 
  size = 'md',
  disabled = false,
  primaryColor,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props 
}: PrimaryButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 h-8 rounded-lg',
    md: 'px-4 py-2.5 h-10 rounded-[10px]',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-2.5',
    md: 'w-4 h-2.5',
  };

  const focusRingClasses = {
    sm: 'w-24 h-8 left-[-2px] top-[-2px] absolute rounded-[10px] outline outline-2 outline-border-focus',
    md: 'w-28 h-10 left-[-4px] top-[-4px] absolute rounded-2xl border-2 border-border-focus',
  };

  // Determine state classes with fallbacks
  // Tailwind classes come last to ensure they take precedence over design token classes
  let bgClass = 'bg-components-button-primary-blue-bg-default bg-primary-500';
  let textClass = 'text-components-button-primary-text-default text-white';
  let iconClass = 'bg-components-button-primary-icon-default';

  if (disabled) {
    bgClass = 'bg-components-button-neutral-bg-default bg-gray-200';
    textClass = 'text-components-button-neutral-text-default text-gray-500';
    iconClass = 'bg-components-button-neutral-icon-default';
  } else if (isActive) {
    bgClass = 'bg-components-button-primary-blue-bg-active bg-primary-700';
    textClass = 'text-components-button-primary-text-active text-white';
    iconClass = 'bg-components-button-primary-icon-active';
  } else if (isHovered) {
    bgClass = 'bg-components-button-primary-blue-bg-hover bg-primary-600';
    textClass = 'text-components-button-primary-text-hover text-white';
    iconClass = 'bg-components-button-primary-icon-hover';
  } else if (isFocused) {
    bgClass = 'bg-components-button-primary-blue-bg-default bg-primary-500';
    textClass = 'text-components-button-primary-text-focus text-white';
    iconClass = 'bg-components-button-primary-icon-focus';
  }

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(false);
    setIsKeyboardFocus(false);
    onBlur?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent focus ring on mouse clicks
    setIsKeyboardFocus(false);
    if (!disabled) setIsActive(true);
    onMouseDown?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    setIsActive(false);
    onMouseLeave?.(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsActive(false);
    onMouseUp?.(e);
  };

  // Calculate hover and active colors from primaryColor if provided
  const parseColor = (color: string): { r: number; g: number; b: number } => {
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }
    
    // Handle hex format
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      // 3-digit hex
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    // 6-digit hex
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
    };
  };

  const getHoverColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    // Darken by approximately 15% for a noticeable but subtle hover effect
    const hoverR = Math.max(0, Math.floor(r * 0.85));
    const hoverG = Math.max(0, Math.floor(g * 0.85));
    const hoverB = Math.max(0, Math.floor(b * 0.85));
    return `rgb(${hoverR}, ${hoverG}, ${hoverB})`;
  };

  const getActiveColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    // Darken by approximately 30% for active state (more than hover)
    const activeR = Math.max(0, Math.floor(r * 0.70));
    const activeG = Math.max(0, Math.floor(g * 0.70));
    const activeB = Math.max(0, Math.floor(b * 0.70));
    return `rgb(${activeR}, ${activeG}, ${activeB})`;
  };

  const buttonStyle: React.CSSProperties = {};
  // Apply primaryColor styles only when provided and not disabled
  // Note: Design token classes are always applied, inline styles override background color
  if (primaryColor && !disabled) {
    if (isActive) {
      buttonStyle.backgroundColor = getActiveColor(primaryColor);
    } else if (isHovered) {
      // Hover takes precedence over focus
      buttonStyle.backgroundColor = getHoverColor(primaryColor);
    } else if (isFocused) {
      // Focus uses default color
      buttonStyle.backgroundColor = primaryColor;
    } else {
      buttonStyle.backgroundColor = primaryColor;
    }
  }

  // Check if button should be full width
  const isFullWidth = className.includes('w-full');
  const wrapperClass = isFullWidth ? 'relative w-full' : 'relative inline-flex';

  return (
    <div className={wrapperClass}>
      <button
        {...props}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          // Mark as keyboard focus when Tab, Enter, or Space is pressed
          if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
            setIsKeyboardFocus(true);
          }
          props.onKeyDown?.(e);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={buttonStyle}
        className={`
          ${sizeClasses[size]}
          ${bgClass}
          ${!primaryColor && !disabled ? 'hover:bg-primary-600' : ''}
          ${isFullWidth ? 'w-full' : 'inline-flex'} justify-center items-center gap-2
          ${textClass}
          text-sm font-medium font-['Poppins'] leading-5 tracking-tight
          transition-all duration-200
          focus:outline-none
          focus-visible:outline-none
          active:outline-none
          border-none
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {icon && (
          <div 
            data-size={size === 'sm' ? '16' : '18'} 
            data-style="Regular" 
            className={`h-4 ${size === 'md' ? 'min-w-4' : ''} inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden`}
          >
            {React.isValidElement(icon) ? (
              <div className={`${iconSizeClasses[size]} ${!primaryColor || disabled ? iconClass : (isHovered ? 'bg-components-button-primary-icon-hover' : isActive ? 'bg-components-button-primary-icon-active' : isFocused ? 'bg-components-button-primary-icon-focus' : 'bg-components-button-primary-icon-default')} flex items-center justify-center`}>
                {icon}
              </div>
            ) : (
              <div className={`${iconSizeClasses[size]} ${!primaryColor || disabled ? iconClass : (isHovered ? 'bg-components-button-primary-icon-hover' : isActive ? 'bg-components-button-primary-icon-active' : isFocused ? 'bg-components-button-primary-icon-focus' : 'bg-components-button-primary-icon-default')}`} />
            )}
          </div>
        )}
        {children}
      </button>
      {isFocused && !disabled && isKeyboardFocus && (
        <div 
          className={focusRingClasses[size]}
          style={{ borderColor: primaryColor || '#4D3EE0', outlineColor: primaryColor || '#4D3EE0' }}
        />
      )}
    </div>
  );
}
