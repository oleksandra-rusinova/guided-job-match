import { Check } from "lucide-react";
import React from "react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  primaryColor?: string;
  useBrandColor?: boolean; // Only use primary color in view mode, not in editor
}

export default function Checkbox({
  label,
  size = "md",
  checked = false,
  disabled = false,
  className = "",
  id,
  primaryColor = '#4D3EE0',
  useBrandColor = false,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `cb-${Math.random().toString(16).slice(2, 9)}`;

  const boxSizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizes: Record<'sm' | 'md' | 'lg', number> = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2 select-none ${className} ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{ margin: 0, padding: 0, lineHeight: 1 }}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="sr-only"
        {...props}
      />

      <span
        className={`grid place-items-center rounded-md border-2 transition-all duration-200 ${boxSizes[size]} ${
          disabled
            ? "border-gray-300 bg-gray-100"
            : checked
              ? ""
              : "border-gray-300 bg-white"
        }`}
        style={{
          ...(!disabled && checked
            ? {
                borderColor: primaryColor,
                backgroundColor: primaryColor,
              }
            : !disabled && !checked && useBrandColor
              ? {}
              : undefined),
          flexShrink: 0,
          alignSelf: 'center',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !checked) {
            if (useBrandColor) {
              e.currentTarget.style.borderColor = primaryColor;
            } else {
              e.currentTarget.style.borderColor = '#D1D5DB';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !checked) {
            e.currentTarget.style.borderColor = '#D1D5DB';
          }
        }}
      >
        {checked && (
          <Check
            size={iconSizes[size]}
            className="pointer-events-none text-white"
            strokeWidth={3}
          />
        )}
      </span>

      {label && (
        <span
          className={`text-sm leading-none ${
            disabled ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
}
