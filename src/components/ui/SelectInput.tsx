import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

const inputStyle = {
  '--background': '#f5f5f5',
  '--border-radius': '12px',
  '--padding-start': '16px',
  '--inner-padding-end': '16px',
  '--min-height': '52px',
  marginBottom: '8px',
} as any;

interface SelectInputProps {
  label: string;
  value: any;
  options: Array<{ id: any; name: string }>;
  onChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder
}) => {
  return (
    <IonItem style={inputStyle}>
      <IonLabel style={{ fontWeight: 600, fontSize: '13px', color: '#555', minWidth: '80px' }}>{label}</IonLabel>
      <IonSelect
        value={value}
        onIonChange={(e: any) => onChange(e.detail.value)}
        interface="popover"
        disabled={disabled}
      >
        {placeholder && <IonSelectOption value={0}>{placeholder}</IonSelectOption>}
        {options.map((opt) => (
          <IonSelectOption key={opt.id} value={opt.id}>{opt.name}</IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default SelectInput;
