import React from 'react';
import Checkbox from './Checkbox';

interface ShowLabelToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  primaryColor: string;
}

export default function ShowLabelToggle({ checked, onChange, label = 'Show label', primaryColor }: ShowLabelToggleProps) {
  // In editor mode, use system default color. In view mode, use prototype's branding color
  // Since ShowLabelToggle is only used in editor mode (CreatePrototype), we ignore primaryColor
  // and let Checkbox use its default system color (#4D3EE0)
  return (
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      label={label}
    />
  );
}


