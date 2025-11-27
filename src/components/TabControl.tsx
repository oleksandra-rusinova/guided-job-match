export interface TabOption {
  value: string;
  label: string;
}

interface TabControlProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function TabControl({ 
  options, 
  value, 
  onChange, 
  className = ''
}: TabControlProps) {
  return (
    <div className={`inline-flex rounded-lg bg-gray-100 p-1 ${className}`}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-2 py-1 text-sm font-regular rounded-lg transition-all duration-200 ${
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300'
          } ${index === 0 ? 'mr-1' : index === options.length - 1 ? 'ml-1' : 'mx-1'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
