import CustomDropdown from './CustomDropdown';

interface DropdownFieldProps {
  value: string;
  placeholder?: string;
  primaryColor: string;
  disabled?: boolean;
  options: Array<{ id: string; title?: string }>;
  onChange: (value: string) => void;
}

export default function DropdownField({ 
  value, 
  placeholder = 'Select an option', 
  primaryColor, 
  disabled = false, 
  options = [],
  onChange 
}: DropdownFieldProps) {
  return (
    <CustomDropdown
      value={value}
      placeholder={placeholder}
      primaryColor={primaryColor}
      disabled={disabled}
      options={options}
      onChange={onChange}
    />
  );
}