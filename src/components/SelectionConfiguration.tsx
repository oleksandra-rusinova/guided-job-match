import NumberField from './NumberField';
import RadioButton from './RadioButton';

interface SelectionConfigurationProps {
  elementId: string;
  selectionType?: 'single' | 'multiple';
  maxSelection?: number;
  maxOptions?: number;
  primaryColor?: string;
  onSelectionTypeChange: (selectionType: 'single' | 'multiple') => void;
  onMaxSelectionChange: (maxSelection: number) => void;
}

export default function SelectionConfiguration({
  elementId,
  selectionType = 'single',
  maxSelection = 1,
  maxOptions = 10,
  primaryColor = '#E8EAEE',
  onSelectionTypeChange,
  onMaxSelectionChange,
}: SelectionConfigurationProps) {
  return (
    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-4">Selection Configuration</h4>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <RadioButton
            label="Only one card"
            name={`selection-type-${elementId}`}
            checked={selectionType === 'single'}
            onChange={() => onSelectionTypeChange('single')}
            size="sm"
          />
          <RadioButton
            label="More than 1 card"
            name={`selection-type-${elementId}`}
            checked={selectionType === 'multiple'}
            onChange={() => onSelectionTypeChange('multiple')}
            size="sm"
          />
        </div>
        
        {selectionType === 'multiple' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-800">Maximum cards:</label>
            <NumberField
              value={maxSelection}
              onChange={onMaxSelectionChange}
              min={2}
              max={maxOptions}
              size="sm"
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
