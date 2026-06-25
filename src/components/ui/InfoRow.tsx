import React from 'react';

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  showBorder?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueColor = '#333', showBorder = true }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    ...(showBorder ? { borderBottom: '1px solid #f0f0f0' } : {})
  }}>
    <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 600, color: valueColor }}>{value}</span>
  </div>
);

export default InfoRow;
