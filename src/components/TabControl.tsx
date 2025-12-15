export interface TabOption {
  value: string;
  label: string;
}

interface TabControlProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  primaryColor?: string;
}

export default function TabControl({ 
  options, 
  value, 
  onChange, 
  className = '',
  primaryColor = '#4D3EE0'
}: TabControlProps) {
  const isFullWidth = className.includes('w-full');
  return (
    <div className={`${isFullWidth ? 'flex gap-1' : 'inline-flex'} rounded-lg bg-gray-200 p-1 ${className}`}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${isFullWidth ? 'min-w-0' : ''} px-2 py-1 text-sm font-regular rounded-lg transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300'
          } ${!isFullWidth && (index === 0 ? 'mr-1' : index === options.length - 1 ? 'ml-1' : 'mx-1')}`}
          style={{
            '--tw-outline-color': primaryColor,
            ...(isFullWidth ? { flex: '1 1 0%' } : {})
          } as React.CSSProperties & { '--tw-outline-color': string }}
          onFocus={(e) => {
            // Only show focus ring on keyboard focus (focus-visible)
            if (e.target.matches(':focus-visible')) {
              e.currentTarget.style.outline = `2px solid ${primaryColor}`;
              e.currentTarget.style.outlineOffset = '2px';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = '';
            e.currentTarget.style.outlineOffset = '';
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
