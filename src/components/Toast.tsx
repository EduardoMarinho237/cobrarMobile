import React, { useRef } from 'react';
import { IonToast } from '@ionic/react';

interface ToastProps {
  isOpen: boolean;
  message: string;
  color: string;
  onDidDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ isOpen, message, color, onDidDismiss }) => {
  return (
    <IonToast
      isOpen={isOpen}
      message={message}
      color={color}
      duration={3000}
      position="top"
      onDidDismiss={onDidDismiss}
    />
  );
};

export default Toast;
