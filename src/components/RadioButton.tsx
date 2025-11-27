import React from 'react';

interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card';
}

export default function RadioButton({ 
  label, 
  size = 'md', 
  variant = 'default',
  checked = false,
  disabled = false,
  className = '',
  id,
  ...props 
}: RadioButtonProps) {
  const radioId = id || `radio-${Math.random().toString(16).substr(2, 9)}`;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const iconSizes = {
    sm: 8,
    md: 10,
    lg: 12,
  };
  
  
  const cardClasses = variant === 'card' ? 'rounded-lg p-4 border hover:bg-gray-50' : '';
  
  return (
    <label 
      htmlFor={radioId} 
      className={`flex items-center gap-2 cursor-pointer select-none ${cardClasses} ${className} ${
        disabled ? 'cursor-not-allowed' : ''
      }`}
    >
      <input
        type="radio"
        id={radioId}
        checked={checked}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <span
        className={`
          relative inline-flex items-center justify-center rounded-full border transition-all duration-200
          ${sizeClasses[size]}
          ${
            disabled
              ? 'border-gray-300 bg-gray-100'
              : checked
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300 bg-white hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          }
        `}
      >
        {checked && (
          <span
            className="rounded-full bg-white"
            style={{ width: iconSizes[size], height: iconSizes[size] }}
          />
        )}
      </span>
  
      {label && (
        <span
          className={`text-sm font-regular leading-none ${
            disabled ? 'text-gray-400' : 'text-gray-700'
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
}