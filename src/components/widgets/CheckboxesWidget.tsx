import { useState } from 'react';
import { Check } from 'lucide-react';

interface CheckboxesWidgetProps {
  config: any;
  pageNumber: number;
}

export default function CheckboxesWidget({ config, pageNumber }: CheckboxesWidgetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const newSelected = new Set(selected);
    const selectionType = config.selectionType || 'multiple';
    const maxSelection = config.maxSelection || 2;

    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (selectionType === 'single') {
        // For single selection, clear all others and select this one
        newSelected.clear();
        newSelected.add(id);
      } else {
        // For multiple selection, check max selection limit
        if (newSelected.size < maxSelection) {
          newSelected.add(id);
        }
      }
    }
    setSelected(newSelected);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg mb-4" style={{ backgroundColor: '#E8E5FB', color: '#2563EB' }}>
          {pageNumber}
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {config.title || 'Select options'}
        </h2>
        <p className="text-gray-600">
          {config.description || (config.selectionType === 'single' ? 'Choose one option' : 'Choose all that apply')}
        </p>
        {config.selectionType === 'multiple' && config.maxSelection && (
          <p className="text-sm text-gray-500 mt-1">
            Maximum {config.maxSelection} selection{config.maxSelection > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {config.options?.map((option: any) => {
          const isSelected = selected.has(option.id);
          const isDisabled = !isSelected && 
            config.selectionType === 'multiple' && 
            selected.size >= (config.maxSelection || 2);
          
          return (
            <button
              key={option.id}
              onClick={() => toggle(option.id)}
              disabled={isDisabled}
              className={`w-full p-6 rounded-xl border transition-all text-left flex items-start gap-4 ${
                isSelected
                  ? 'bg-blue-50 border-2'
                  : isDisabled
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={isSelected ? { borderColor: '#2563EB' } : {}}
            >
              <div
                className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected
                    ? 'border-2'
                    : 'border-gray-300 bg-white'
                }`}
                style={isSelected ? { borderColor: '#2563EB', backgroundColor: '#2563EB' } : {}}
              >
                {isSelected && <Check size={16} className="text-white" />}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
                {option.description && (
                  <p className="text-gray-600 text-sm">{option.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
