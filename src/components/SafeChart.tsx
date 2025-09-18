// src/components/SafeChart.tsx
import React from 'react';
import { Alert, Typography } from 'antd';
import { ResponsiveContainer } from 'recharts';

const { Text } = Typography;

interface SafeChartProps {
  data: any[];
  height?: number;
  children: React.ReactNode;
  emptyMessage?: string;
}

export const SafeChart: React.FC<SafeChartProps> = ({
  data,
  height = 300,
  children,
  emptyMessage = "No hay datos disponibles para mostrar"
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px dashed #d9d9d9',
        borderRadius: 8,
        background: '#fafafa'
      }}>
        <Alert
          message="Sin datos"
          description={emptyMessage}
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
};