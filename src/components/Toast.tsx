import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';

interface ToastProps {
  isOpen: boolean;
  message: string;
  color: string;
  onDidDismiss: () => void;
}

const AUTO_MS = 1500;
const FADE_MS = 200;

const Toast: React.FC<ToastProps> = ({ isOpen, message, color, onDidDismiss }) => {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDidDismissRef = useRef(onDidDismiss);
  onDidDismissRef.current = onDidDismiss;

  const prevOpen = useRef(false);
  const prevMsg = useRef('');

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hide = () => {
    clear();
    setLeaving(true);
    setTimeout(() => {
      setShow(false);
      setLeaving(false);
      onDidDismissRef.current();
    }, FADE_MS);
  };

  const showToast = () => {
    clear();
    setLeaving(false);
    setShow(true);
    timerRef.current = setTimeout(hide, AUTO_MS);
  };

  useEffect(() => {
    const wasOpen = prevOpen.current;
    const wasMsg = prevMsg.current;
    prevOpen.current = isOpen;
    prevMsg.current = message;

    if (isOpen && (!wasOpen || message !== wasMsg)) {
      showToast();
    } else if (!isOpen && wasOpen && show) {
      hide();
    }
  });

  if (!show) return null;

  const accentColor = color === 'success' ? '#098947' : '#dc3545';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top, 0px) + 10px)',
        left: '16px',
        right: '16px',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        userSelect: 'none',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(-8px)' : 'translateY(0)',
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        animation: leaving ? 'none' : 'toastSlideIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderLeft: `4px solid ${accentColor}`,
        }}
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          flexShrink: 0,
        }} />
        <span style={{
          flex: 1,
          fontSize: '14px',
          color: '#262626',
          fontWeight: 500,
          lineHeight: '1.4',
        }}>
          {message}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); hide(); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderRadius: '50%',
            width: '28px',
            height: '28px',
          }}
        >
          <IonIcon icon={close} style={{ fontSize: '18px', color: '#999' }} />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Toast;
