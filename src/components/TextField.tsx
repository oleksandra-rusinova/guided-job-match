import { useState, ReactNode, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

interface TextFieldProps {
  label?: string;
  showLabel?: boolean;
  value: string;
  placeholder?: string;
  primaryColor: string;
  disabled?: boolean;
  helperText?: string;
  error?: boolean;
  onChange: (value: string) => void;
  leftIcon?: ReactNode;
}

export default function TextField({ 
  label = 'Label', 
  showLabel = true, 
  value, 
  placeholder = 'Placeholder', 
  primaryColor: _primaryColor, // eslint-disable-line @typescript-eslint/no-unused-vars 
  disabled = false,
  helperText,
  error = false,
  onChange,
  leftIcon
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Determine border color based on state
  let borderColor: string;
  if (error) {
    borderColor = '#B91C1C'; // red-700
  } else if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
  } else if (isFocused) {
    borderColor = '#9CA3AF'; // gray-400
  } else if (isHovered) {
    borderColor = '#9CA3AF'; // gray-400
  } else {
    borderColor = '#E5E7EB'; // gray-200
  }

  // Text colors
  const labelColor = disabled ? '#9CA3AF' : '#64748B'; // gray-400 : slate-500
  const inputTextColor = disabled ? '#9CA3AF' : (value ? '#3F3F46' : '#64748B'); // gray-400 : (zinc-700 : slate-500)
  const placeholderColor = disabled ? '#9CA3AF' : '#64748B'; // gray-400 : slate-500 - always consistent regardless of label state
  const helperTextColor = error ? '#DC2626' : (disabled ? '#9CA3AF' : '#64748B'); // red-600 : (gray-400 : slate-500)
  
  // Generate unique ID for this field instance to ensure placeholder styles are scoped
  const fieldId = useMemo(() => `text-field-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className="w-full flex flex-col justify-start items-start gap-2">
      {showLabel && (
        <div 
          className="self-stretch justify-start text-base font-normal font-['Poppins'] leading-6 tracking-tight"
          style={{ color: labelColor }}
        >
          {label}
        </div>
      )}

      <div 
        className="self-stretch p-4 bg-white rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex justify-start items-center relative"
        style={{ 
          outlineColor: borderColor,
        }}
        onMouseEnter={() => !disabled && !error && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {leftIcon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        <div className="flex-1 flex justify-start items-center">
          <div className="flex-1 justify-start text-base font-normal font-['Poppins'] leading-6 tracking-tight">
            <style dangerouslySetInnerHTML={{__html: `
              input[data-field-id="${fieldId}"]::placeholder {
                color: ${placeholderColor} !important;
                opacity: 1;
                font-size: 16px;
                font-family: 'Poppins', sans-serif;
                font-weight: 400;
                line-height: 24px;
                letter-spacing: 0.2px;
              }
            `}} />
            <input
              type="text"
              data-field-id={fieldId}
              disabled={disabled}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="flex-1 w-full justify-start text-base font-normal font-['Poppins'] leading-6 tracking-tight focus:outline-none bg-transparent border-none outline-none"
              style={{
                color: inputTextColor,
                paddingLeft: leftIcon ? '2.5rem' : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {helperText && (
        <div className="self-stretch inline-flex justify-start items-start gap-2">
          {error && (
            <div className="h-4 flex justify-start items-center gap-2.5">
              <div data-size="14" data-style="Solid" className="h-3.5 py-px inline-flex flex-col justify-center items-center gap-2 overflow-hidden">
                <AlertCircle size={14} style={{ color: '#DC2626' }} />
              </div>
            </div>
          )}
          <div 
            className="justify-start text-xs font-normal font-['Poppins'] leading-4 tracking-tight"
            style={{ color: helperTextColor }}
          >
            {helperText}
          </div>
        </div>
      )}
    </div>
  );
}


