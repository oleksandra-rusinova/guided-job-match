import React, { useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = "w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none hover:shadow-md transition-all duration-200";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "";
  const labelClasses = "block text-sm font-medium mb-2";
  const labelStyle = { color: '#464F5E' };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
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
      return (
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={`${baseClasses} resize-none ${disabledClasses} ${className}`}
        />
      );
    }

    if (type === 'dropdown') {
      const selectedOption = options.find(opt => opt.id === value);
      const displayValue = selectedOption ? (selectedOption.title || `Option ${selectedOption.id}`) : '';
      
      return (
        <div className="relative">
          <select
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`${baseClasses} pr-10 appearance-none cursor-pointer ${disabledClasses} ${className}`}
            style={{
              color: displayValue ? '#111827' : '#9CA3AF'
            }}
          >
            {!value && placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title || `Option ${option.id}`}
              </option>
            ))}
          </select>
          <ChevronDown 
            size={20} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            style={{ color: disabled ? '#9CA3AF' : '#6B7280' }}
          />
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
