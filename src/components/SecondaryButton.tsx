import React, { useState } from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md';
  primaryColor?: string;
}

export default function SecondaryButton({ 
  children, 
  icon,
  variant = 'default',
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
}: SecondaryButtonProps) {
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
  let bgClass = '';
  let textClass = '';
  let iconClass = '';
  let borderClass = '';
  let outlineClass = '';

  if (variant === 'ghost') {
    // Ghost variant (no background, no border)
    if (disabled) {
      bgClass = 'bg-components-button-secondary-bg-disabled bg-white';
      textClass = 'text-components-button-secondary-text-disabled text-gray-400';
      iconClass = 'bg-components-button-secondary-icon-disabled';
    } else if (isActive) {
      bgClass = 'bg-components-button-secondary-ghost-bg-active bg-gray-100';
      textClass = 'text-components-button-secondary-ghost-text-active text-gray-900';
      iconClass = 'bg-components-button-secondary-ghost-icon-active';
    } else if (isFocused) {
      textClass = 'text-components-button-secondary-ghost-text-focus text-primary-600';
      iconClass = 'bg-components-button-secondary-ghost-icon-focus';
    } else if (isHovered) {
      bgClass = 'bg-components-button-secondary-ghost-bg-hover bg-gray-50';
      textClass = 'text-components-button-secondary-ghost-text-hover text-gray-800';
      iconClass = 'bg-components-button-secondary-ghost-icon-hover';
    } else {
      textClass = 'text-components-button-secondary-ghost-text-default text-gray-700';
      iconClass = 'bg-components-button-secondary-ghost-icon-default';
    }
  } else {
    // Default variant (with outline)
    if (disabled) {
      bgClass = 'bg-components-button-secondary-bg-disabled bg-white';
      textClass = 'text-components-button-secondary-text-disabled text-gray-400';
      iconClass = 'bg-components-button-secondary-icon-disabled';
      borderClass = 'outline-components-button-secondary-border-disabled outline-gray-300';
    } else if (isActive) {
      bgClass = 'bg-components-button-secondary-bg-active bg-gray-50';
      textClass = 'text-components-button-secondary-text-active text-gray-900';
      iconClass = 'bg-components-button-secondary-icon-active';
      borderClass = 'outline-components-button-secondary-border-active outline-gray-400';
    } else if (isFocused) {
      bgClass = 'bg-components-button-secondary-bg-focus bg-white';
      textClass = 'text-components-button-secondary-text-focus text-gray-900';
      iconClass = 'bg-components-button-secondary-icon-focus';
      borderClass = 'outline-components-button-secondary-border-focus outline-primary-500';
    } else if (isHovered) {
      bgClass = 'bg-components-button-secondary-bg-hover bg-gray-50';
      textClass = 'text-components-button-secondary-text-hover text-gray-800';
      iconClass = 'bg-components-button-secondary-icon-hover';
      borderClass = 'outline-components-button-secondary-border-hover outline-gray-400';
    } else {
      bgClass = 'bg-components-button-secondary-bg-default bg-white';
      textClass = 'text-components-button-secondary-text-default text-gray-700';
      iconClass = 'bg-components-button-secondary-icon-default';
      borderClass = 'outline-components-button-secondary-border-default outline-gray-300';
    }
    outlineClass = `outline outline-1 outline-offset-[-1px] ${borderClass}`;
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
    // Darken by approximately 15% for hover
    const hoverR = Math.max(0, Math.floor(r * 0.85));
    const hoverG = Math.max(0, Math.floor(g * 0.85));
    const hoverB = Math.max(0, Math.floor(b * 0.85));
    return `rgb(${hoverR}, ${hoverG}, ${hoverB})`;
  };

  const getActiveColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    // Darken by approximately 30% for active state
    const activeR = Math.max(0, Math.floor(r * 0.70));
    const activeG = Math.max(0, Math.floor(g * 0.70));
    const activeB = Math.max(0, Math.floor(b * 0.70));
    return `rgb(${activeR}, ${activeG}, ${activeB})`;
  };

  // Apply primaryColor for border and text when provided
  const buttonStyle: React.CSSProperties = {};
  if (primaryColor && !disabled && variant === 'default') {
    // Use primaryColor for border with appropriate state colors
    if (isActive) {
      buttonStyle.outlineColor = getActiveColor(primaryColor);
      buttonStyle.color = getActiveColor(primaryColor);
    } else if (isHovered) {
      buttonStyle.outlineColor = getHoverColor(primaryColor);
      buttonStyle.color = getHoverColor(primaryColor);
    } else if (isFocused) {
      buttonStyle.outlineColor = primaryColor;
      buttonStyle.color = primaryColor;
    } else {
      buttonStyle.outlineColor = primaryColor;
      buttonStyle.color = primaryColor;
    }
  } else if (primaryColor && !disabled && variant === 'ghost') {
    // For ghost variant, only apply color to text
    if (isActive) {
      buttonStyle.color = getActiveColor(primaryColor);
    } else if (isHovered) {
      buttonStyle.color = getHoverColor(primaryColor);
    } else if (isFocused) {
      buttonStyle.color = primaryColor;
    } else {
      buttonStyle.color = primaryColor;
    }
  }

  return (
    <div className="relative inline-flex">
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
          ${disabled || (primaryColor && variant === 'default' && !disabled) ? '' : outlineClass}
          ${primaryColor && variant === 'default' && !disabled ? 'outline outline-1 outline-offset-[-1px]' : ''}
          inline-flex justify-center items-center gap-2
          ${disabled || (primaryColor && !disabled && variant === 'ghost') ? '' : textClass}
          text-sm font-medium font-['Poppins'] leading-5 tracking-tight
          transition-all duration-200
          focus:outline-none
          focus-visible:outline-none
          active:outline-none
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
        <div 
          className={focusRingClasses[size]}
          style={{ borderColor: primaryColor || '#4D3EE0', outlineColor: primaryColor || '#4D3EE0' }}
        />
      )}
    </div>
  );
}


