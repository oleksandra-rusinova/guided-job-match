import CustomDropdown from './CustomDropdown';

interface DropdownFieldProps {
  value: string;
  placeholder?: string;
  primaryColor: string;
  disabled?: boolean;
  options: Array<{ id: string; title?: string }>;
  onChange: (value: string) => void;
  label?: string;
  showLabel?: boolean;
}

export default function DropdownField({ 
  value, 
  placeholder = 'Select an option', 
  primaryColor, 
  disabled = false, 
  options = [],
  onChange,
  label,
  showLabel = false
}: DropdownFieldProps) {
  const labelColor = disabled ? '#9CA3AF' : '#64748B'; // gray-400 : slate-500

  return (
    <div className="w-full flex flex-col justify-start items-start gap-2">
      {showLabel && label && (
        <div 
          className="self-stretch justify-start text-base font-normal font-['Poppins'] leading-6 tracking-tight"
          style={{ color: labelColor }}
        >
          {label}
        </div>
      )}
      <CustomDropdown
        value={value}
        placeholder={placeholder}
        primaryColor={primaryColor}
        disabled={disabled}
        options={options}
        onChange={onChange}
      />
    </div>
  );
}