import React, { useState } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'text';
  size?: 'sm' | 'md';
  primaryColor?: string;
}

export default function IconButton({ 
  icon,
  variant = 'primary',
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
}: IconButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-[10px]',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const focusRingClasses = {
    sm: 'w-10 h-10 left-[-4px] top-[-4px] absolute rounded-[10px] outline outline-2 outline-border-focus',
    md: 'w-12 h-12 left-[-4px] top-[-4px] absolute rounded-2xl border-2 border-border-focus',
  };

  // Determine state classes with fallbacks
  let bgClass = '';
  let iconClass = '';
  let borderClass = '';
  let outlineClass = '';

  if (variant === 'primary') {
    if (disabled) {
      bgClass = 'bg-components-button-neutral-bg-default bg-gray-200';
      iconClass = 'bg-components-button-neutral-icon-default';
    } else if (isActive) {
      bgClass = 'bg-components-button-primary-blue-bg-active bg-primary-700';
      iconClass = 'bg-components-button-primary-icon-active';
    } else if (isHovered) {
      bgClass = 'bg-components-button-primary-blue-bg-hover bg-primary-600';
      iconClass = 'bg-components-button-primary-icon-hover';
    } else if (isFocused) {
      bgClass = 'bg-components-button-primary-blue-bg-default bg-primary-500';
      iconClass = 'bg-components-button-primary-icon-focus';
    } else {
      bgClass = 'bg-components-button-primary-blue-bg-default bg-primary-500';
      iconClass = 'bg-components-button-primary-icon-default';
    }
  } else if (variant === 'secondary') {
    if (disabled) {
      bgClass = 'bg-components-button-secondary-bg-disabled bg-white';
      iconClass = 'bg-components-button-secondary-icon-disabled';
      borderClass = 'outline-components-button-secondary-border-disabled outline-gray-300';
    } else if (isActive) {
      bgClass = 'bg-components-button-secondary-bg-active bg-gray-50';
      iconClass = 'bg-components-button-secondary-icon-active';
      borderClass = 'outline-components-button-secondary-border-active outline-gray-400';
    } else if (isFocused) {
      bgClass = 'bg-components-button-secondary-bg-focus bg-white';
      iconClass = 'bg-components-button-secondary-icon-focus';
      borderClass = 'outline-components-button-secondary-border-focus outline-primary-500';
    } else if (isHovered) {
      bgClass = 'bg-components-button-secondary-bg-hover bg-gray-50';
      iconClass = 'bg-components-button-secondary-icon-hover';
      borderClass = 'outline-components-button-secondary-border-hover outline-gray-400';
    } else {
      bgClass = 'bg-components-button-secondary-bg-default bg-white';
      iconClass = 'bg-components-button-secondary-icon-default';
      borderClass = 'outline-components-button-secondary-border-default outline-gray-300';
    }
    outlineClass = `outline outline-1 outline-offset-[-1px] ${borderClass}`;
  } else if (variant === 'ghost') {
    if (disabled) {
      bgClass = 'bg-components-button-secondary-bg-disabled bg-white';
      iconClass = 'bg-components-button-secondary-icon-disabled';
    } else if (isActive) {
      bgClass = 'bg-components-button-secondary-ghost-bg-active bg-gray-100';
      iconClass = 'bg-components-button-secondary-ghost-icon-active';
    } else if (isFocused) {
      iconClass = 'bg-components-button-secondary-ghost-icon-focus';
    } else if (isHovered) {
      bgClass = 'bg-components-button-secondary-ghost-bg-hover bg-gray-50';
      iconClass = 'bg-components-button-secondary-ghost-icon-hover';
    } else {
      iconClass = 'bg-components-button-secondary-ghost-icon-default';
    }
  } else if (variant === 'text') {
    if (disabled) {
      bgClass = 'bg-components-button-neutral-bg-default bg-gray-200';
      iconClass = 'bg-components-button-neutral-icon-default';
    } else if (isActive) {
      bgClass = 'bg-components-button-tertiary-ghost-bg-active bg-gray-100';
      iconClass = 'bg-components-button-tertiary-ghost-icon-active';
    } else if (isFocused) {
      iconClass = 'bg-components-button-tertiary-ghost-icon-focus';
    } else if (isHovered) {
      bgClass = 'bg-components-button-tertiary-ghost-bg-hover bg-gray-100';
      iconClass = 'bg-components-button-tertiary-ghost-icon-hover';
    } else {
      iconClass = 'bg-components-button-tertiary-ghost-icon-default';
    }
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

  // Apply primaryColor styles when provided
  const buttonStyle: React.CSSProperties = {};
  if (primaryColor && !disabled) {
    if (variant === 'primary') {
      if (isActive) {
        buttonStyle.backgroundColor = getActiveColor(primaryColor);
      } else if (isHovered) {
        buttonStyle.backgroundColor = getHoverColor(primaryColor);
      } else if (isFocused) {
        buttonStyle.backgroundColor = primaryColor;
      } else {
        buttonStyle.backgroundColor = primaryColor;
      }
    } else if (variant === 'secondary') {
      if (isActive) {
        buttonStyle.outlineColor = getActiveColor(primaryColor);
      } else if (isHovered) {
        buttonStyle.outlineColor = getHoverColor(primaryColor);
      } else if (isFocused) {
        buttonStyle.outlineColor = primaryColor;
      } else {
        buttonStyle.outlineColor = primaryColor;
      }
    } else if (variant === 'ghost' || variant === 'text') {
      // For ghost and text variants, apply color to icon via CSS variable or direct styling
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
          ${variant === 'secondary' && !disabled && (primaryColor || !primaryColor) ? outlineClass : ''}
          ${variant === 'secondary' && primaryColor && !disabled ? 'outline outline-1 outline-offset-[-1px]' : ''}
          inline-flex justify-center items-center
          transition-all duration-200
          focus:outline-none
          focus-visible:outline-none
          active:outline-none
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        aria-label={props['aria-label'] || 'Icon button'}
      >
        <div 
          data-size={size === 'sm' ? '16' : '20'} 
          data-style="Regular" 
          className={`${iconSizeClasses[size]} inline-flex flex-col justify-center items-center overflow-hidden`}
        >
          {React.isValidElement(icon) ? (
            <div 
              className={`
                ${iconSizeClasses[size]} 
                ${variant === 'primary' && (!primaryColor || disabled) ? iconClass : ''}
                ${variant === 'primary' && primaryColor && !disabled ? (isHovered ? 'bg-components-button-primary-icon-hover' : isActive ? 'bg-components-button-primary-icon-active' : isFocused ? 'bg-components-button-primary-icon-focus' : 'bg-components-button-primary-icon-default') : ''}
                ${variant !== 'primary' ? iconClass : ''}
                flex items-center justify-center
                ${primaryColor && !disabled && (variant === 'ghost' || variant === 'text') ? 'text-current' : ''}
              `}
              style={primaryColor && !disabled && (variant === 'ghost' || variant === 'text') ? { color: buttonStyle.color } : undefined}
            >
              {icon}
            </div>
          ) : (
            <div className={`${iconSizeClasses[size]} ${iconClass}`} />
          )}
        </div>
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

