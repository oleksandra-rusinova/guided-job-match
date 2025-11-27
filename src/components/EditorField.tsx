import { useState } from 'react';

interface EditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function EditorField({ 
  value, 
  onChange, 
  placeholder = '', 
  disabled = false,
  className = '' 
}: EditorFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = "px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none hover:shadow-md transition-all duration-200";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "";
  const roundedClasses = "rounded-lg"; // 8px corner radius (rounded-lg in Tailwind)

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      placeholder={placeholder}
      className={`${baseClasses} ${disabledClasses} ${roundedClasses} ${className}`}
    />
  );
}
