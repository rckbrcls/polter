import React from "react";
import SelectInput from "ink-select-input";

interface SimpleSelectItem {
  label: string;
  value: string;
}

interface SimpleSelectProps {
  items: SimpleSelectItem[];
  onSelect: (value: string) => void;
  isFocused?: boolean;
}

export function SimpleSelect({ items, onSelect, isFocused = true }: SimpleSelectProps): React.ReactElement {
  return (
    <SelectInput
      items={items}
      onSelect={(item) => onSelect(item.value)}
      isFocused={isFocused}
    />
  );
}
