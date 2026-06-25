import React from 'react';
import { IonItem, IonInput } from '@ionic/react';

interface StyledInputProps {
  label: string;
  placeholder: string;
  value: string;
  onIonInput: (e: any) => void;
  type?: 'text' | 'password' | 'number';
  marginBottom?: string;
}

const StyledInput: React.FC<StyledInputProps> = ({ label, placeholder, value, onIonInput, type = 'text', marginBottom = '16px' }) => (
  <div style={{ marginBottom }}>
    <IonItem style={{
      '--background': '#f5f5f5',
      '--border-radius': '12px',
      '--padding-start': '16px',
      '--inner-padding-end': '16px',
      '--min-height': '56px',
      '--highlight-color-focused': '#098947',
      '--highlight-color-valid': '#098947'
    }}>
      <IonInput
        label={label}
        labelPlacement="floating"
        placeholder={placeholder}
        value={value}
        onIonInput={onIonInput}
        type={type}
      />
    </IonItem>
  </div>
);

export default StyledInput;
