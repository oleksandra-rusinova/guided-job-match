import { ElementType } from '../types';

export const ELEMENT_TYPES: Array<{ type: ElementType; label: string }> = [
  { type: 'text_field', label: 'Text Field' },
  { type: 'calendar_field', label: 'Calendar Field' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'checkboxes', label: 'Checkbox' },
  { type: 'simple_cards', label: 'Text Cards' },
  { type: 'yes_no_cards', label: 'Yes/No Cards' },
  { type: 'image_cards', label: 'Cards with Image' },
  { type: 'image_only_card', label: 'Image Only Card' },
  { type: 'advanced_cards', label: 'Advanced Cards' },
  { type: 'application_card', label: 'Application Card' },
];

export const getElementLabel = (elementType: ElementType): string => {
  return ELEMENT_TYPES.find(t => t.type === elementType)?.label || elementType.replace('_', ' ');
};
