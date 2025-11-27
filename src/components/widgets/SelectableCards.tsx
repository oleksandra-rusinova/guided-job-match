import { useState } from 'react';

interface SelectableCardsProps {
  config: any;
  pageNumber: number;
  primaryColor: string;
}

export default function SelectableCards({ config, pageNumber, primaryColor }: SelectableCardsProps) {
  const selectionType = config.selectionType || 'single';
  const maxSelection = config.maxSelection || 1;
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleOptionClick = (optionId: string) => {
    if (selectionType === 'single') {
      setSelected([optionId]);
    } else {
      const isSelected = selected.includes(optionId);
      if (isSelected) {
        // Remove from selection
        setSelected(prev => prev.filter(id => id !== optionId));
      } else {
        // Add to selection if under max limit
        if (selected.length < maxSelection) {
          setSelected(prev => [...prev, optionId]);
        }
      }
    }
  };

  const isSelected = (optionId: string) => selected.includes(optionId);

  const getDescription = () => {
    if (selectionType === 'single') {
      return config.description || 'Choose only one';
    } else {
      return config.description || `Choose up to ${maxSelection} option${maxSelection > 1 ? 's' : ''}`;
    }
  };

  const getBorderColor = (optionId: string) => {
    if (isSelected(optionId)) {
      return primaryColor;
    } else if (hoveredCard === optionId) {
      return '#9CA3AF'; // gray-400
    } else {
      return '#E5E7EB'; // gray-200
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg mb-4" style={{ backgroundColor: '#E8E5FB', color: '#2563EB' }}>
          {pageNumber}
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {config.title || 'Select an option'}
        </h2>
        <p className="text-gray-600">{getDescription()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {config.options?.map((option: any) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            onMouseEnter={() => setHoveredCard(option.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`relative p-6 rounded-xl transition-all text-left ${
              isSelected(option.id)
                ? 'bg-gray-50'
                : 'bg-white'
            }`}
            style={{ 
              border: isSelected(option.id) ? `2px solid ${getBorderColor(option.id)}` : `1px solid ${getBorderColor(option.id)}`
            }}
          >
            <div className="absolute top-4 left-4">
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                  isSelected(option.id)
                    ? 'bg-white border-2'
                    : 'border-gray-300 bg-white'
                }`}
                style={isSelected(option.id) ? { borderColor: primaryColor } : {}}
              >
                {isSelected(option.id) && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
              {option.description && (
                <p className="text-gray-600 text-sm">{option.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
