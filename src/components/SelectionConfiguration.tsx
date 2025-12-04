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
  itemLabel?: string; // e.g., "card", "option", "item"
  isDropdown?: boolean; // If true, use dropdown-specific labels
  onCombinedChange?: (updates: { selectionType?: 'single' | 'multiple'; maxSelection?: number }) => void; // Optional combined callback
}

export default function SelectionConfiguration({
  elementId,
  selectionType = 'single',
  maxSelection = 1,
  maxOptions = 10,
  primaryColor = '#E8EAEE',
  onSelectionTypeChange,
  onMaxSelectionChange,
  itemLabel = 'card',
  isDropdown = false,
  onCombinedChange,
}: SelectionConfigurationProps) {
  const singleLabel = isDropdown ? 'No limit' : `Only one ${itemLabel}`;
  const multipleLabel = isDropdown ? 'Number of choices' : `More than 1 ${itemLabel}`;

  // For dropdowns, determine if "No limit" is selected based on maxSelection >= maxOptions
  // Ensure we have valid numbers for comparison
  const currentMaxSelection = maxSelection ?? 1;
  const currentMaxOptions = maxOptions ?? 10;
  
  // For dropdowns: if selectionType is 'single', treat it as not yet configured for multi-choice
  // Show "No limit" as selected by default (since single selection = no multi-choice limit)
  // If selectionType is 'multiple', use maxSelection to determine which option is selected
  const isNoLimit = isDropdown && (
    selectionType === 'single' || 
    (selectionType === 'multiple' && currentMaxSelection >= currentMaxOptions)
  );
  const isNumberOfChoices = isDropdown && selectionType === 'multiple' && currentMaxSelection < currentMaxOptions;

  const handleSelectionTypeChange = (newSelectionType: 'single' | 'multiple') => {
    if (isDropdown) {
      // For dropdowns, both options enable multi-choice (set selectionType to 'multiple')
      // "No limit" sets maxSelection to maxOptions (unlimited)
      // "Number of choices" sets maxSelection to 2 (or keeps current if valid)
      if (newSelectionType === 'single') {
        // "No limit" selected - set to unlimited
        if (onCombinedChange) {
          // Use combined callback to update both values atomically
          onCombinedChange({ selectionType: 'multiple', maxSelection: currentMaxOptions });
        } else {
          // Fallback to separate callbacks
          onMaxSelectionChange(currentMaxOptions);
          onSelectionTypeChange('multiple');
        }
      } else {
        // "Number of choices" selected - set to 2 or keep current valid value
        // If currently single selection, default to 2
        const newMax = selectionType === 'single' 
          ? 2 
          : (currentMaxSelection >= currentMaxOptions ? 2 : Math.max(2, currentMaxSelection));
        if (onCombinedChange) {
          // Use combined callback to update both values atomically
          onCombinedChange({ selectionType: 'multiple', maxSelection: newMax });
        } else {
          // Fallback to separate callbacks
          onMaxSelectionChange(newMax);
          onSelectionTypeChange('multiple');
        }
      }
    } else {
      // For non-dropdowns, use normal behavior
      if (onCombinedChange) {
        onCombinedChange({ selectionType: newSelectionType });
      } else {
        onSelectionTypeChange(newSelectionType);
      }
    }
  };

  return (
    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
      <span className="text-sm font-medium block mb-4" style={{ color: '#464F5E' }}>Selection Configuration</span>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <RadioButton
            label={singleLabel}
            name={`selection-type-${elementId}`}
            checked={isDropdown ? isNoLimit : selectionType === 'single'}
            onChange={() => handleSelectionTypeChange('single')}
            size="sm"
          />
          <RadioButton
            label={multipleLabel}
            name={`selection-type-${elementId}`}
            checked={isDropdown ? isNumberOfChoices : selectionType === 'multiple'}
            onChange={() => handleSelectionTypeChange('multiple')}
            size="sm"
          />
        </div>
        
        {(isDropdown ? isNumberOfChoices : selectionType === 'multiple') && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-800">Maximum {itemLabel}s:</label>
            <NumberField
              value={maxSelection}
              onChange={(newMaxSelection) => {
                if (onCombinedChange) {
                  onCombinedChange({ maxSelection: newMaxSelection });
                } else {
                  onMaxSelectionChange(newMaxSelection);
                }
              }}
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
