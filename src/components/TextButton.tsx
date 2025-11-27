import React, { useState } from 'react';

interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  primaryColor?: string;
}

export default function TextButton({ 
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
}: TextButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);

  // Helper function to parse color string (hex or rgb)
  const parseColor = (color: string): { r: number; g: number; b: number } => {
    // Remove spaces and convert to lowercase
    const normalized = color.trim().toLowerCase();
    
    // Handle hex colors
    if (normalized.startsWith('#')) {
      const hex = normalized.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    
    // Handle rgb/rgba colors
    const rgbMatch = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }
    
    // Default fallback
    return { r: 79, g: 70, b: 229 }; // indigo-600
  };

  const getHoverColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    // Darken by approximately 30% for hover state
    const hoverR = Math.max(0, Math.floor(r * 0.70));
    const hoverG = Math.max(0, Math.floor(g * 0.70));
    const hoverB = Math.max(0, Math.floor(b * 0.70));
    return `rgb(${hoverR}, ${hoverG}, ${hoverB})`;
  };

  const getActiveColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    // Darken by approximately 20% for active state
    const activeR = Math.max(0, Math.floor(r * 0.80));
    const activeG = Math.max(0, Math.floor(g * 0.80));
    const activeB = Math.max(0, Math.floor(b * 0.80));
    return `rgb(${activeR}, ${activeG}, ${activeB})`;
  };

  const sizeClasses = {
    sm: 'rounded-lg',
    md: 'rounded-[10px]',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-2.5',
    md: 'w-4 h-2.5',
  };

  const focusRingClasses = {
    sm: 'w-24 h-9 left-[-2px] top-[-2px] absolute rounded-[10px] outline outline-2 outline-border-focus',
    md: 'w-28 h-11 left-[-2px] top-[-2px] absolute rounded-xl outline outline-2 outline-border-focus',
  };

  // Determine state classes (tertiary ghost variant) with fallbacks
  let bgClass = '';
  let textClass = 'text-components-text-button-primary-text-default';
  let iconClass = '';

  if (disabled) {
    bgClass = 'bg-components-button-neutral-bg-default bg-gray-200';
    textClass = 'text-components-button-neutral-text-default text-gray-500';
    iconClass = 'bg-components-button-neutral-icon-default';
  } else if (isActive) {
    bgClass = 'bg-components-button-tertiary-ghost-bg-active bg-gray-100';
    textClass = 'text-components-text-button-primary-text-default text-primary-700';
    iconClass = 'bg-components-button-tertiary-ghost-icon-active';
  } else if (isFocused) {
    textClass = 'text-components-text-button-primary-text-default text-primary-600';
    iconClass = 'bg-components-button-tertiary-ghost-icon-focus';
  } else if (isHovered) {
    bgClass = '';
    textClass = 'text-components-text-button-primary-text-default text-primary-600';
    iconClass = 'bg-components-button-tertiary-ghost-icon-hover';
  } else {
    textClass = 'text-components-text-button-primary-text-default text-primary-500';
    iconClass = 'bg-components-button-tertiary-ghost-icon-default';
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

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    setIsActive(false);
    onMouseLeave?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent focus ring on mouse clicks
    setIsKeyboardFocus(false);
    if (!disabled) setIsActive(true);
    onMouseDown?.(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsActive(false);
    onMouseUp?.(e);
  };

  // System color constant
  const systemColor = '#4D3EE0';
  
  // Apply primaryColor for text when provided, or use system color
  const buttonStyle: React.CSSProperties = {};
  const colorToUse = primaryColor || systemColor;
  
  // Ensure no border or outline when pressed
  buttonStyle.border = 'none';
  buttonStyle.outline = 'none';
  
  if (!disabled) {
    if (isActive) {
      buttonStyle.color = getActiveColor(colorToUse);
    } else if (isHovered) {
      buttonStyle.color = getHoverColor(colorToUse);
    } else if (isFocused) {
      buttonStyle.color = colorToUse;
    } else {
      buttonStyle.color = colorToUse;
    }
  }

  return (
    <div className="relative inline-block">
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
          inline-flex justify-center items-center gap-2
          ${textClass}
          text-sm font-medium font-['Poppins'] leading-5 tracking-tight
          transition-all duration-200
          focus:outline-none
          focus-visible:outline-none
          active:outline-none
          border-none
          outline-none
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
              <div className={`${iconSizeClasses[size]} ${iconClass} flex items-center justify-center`}>
                {icon}
              </div>
            ) : (
              <div className={`${iconSizeClasses[size]} ${iconClass}`} />
            )}
          </div>
        )}
        {children}
      </button>
      {isFocused && !disabled && isKeyboardFocus && (
        <div className={`${focusRingClasses[size]} outline-primary-500`} />
      )}
    </div>
  );
}
