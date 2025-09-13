// src/components/DebugLogin.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, Alert, Typography } from 'antd';
import { DebugService } from '../services/debugService';
import { testAWSConnection } from '../aws-config';

const { Title, Text } = Typography;

export const DebugLogin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [dynamoContents, setDynamoContents] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      
      // 1. Testear conexión AWS
      const awsConnected = await testAWSConnection();
      setConnectionStatus(awsConnected ? '✅ Conectado a AWS' : '❌ Error de conexión AWS');
      
      // 2. Obtener contenidos de DynamoDB
      const contents = await DebugService.checkDynamoDBContents();
      setDynamoContents(contents || []);
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Spin size="large" />
        <p>Probando conexión con DynamoDB...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>🔍 Debug - Conexión DynamoDB</Title>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          style={{ marginBottom: 20 }}
        />
      )}
      
      <Card title="Estado de la Conexión" style={{ marginBottom: 20 }}>
        <Text strong>{connectionStatus}</Text>
      </Card>
      
      <Card title="Contenido de DynamoDB">
        {dynamoContents.length === 0 ? (
          <Alert message="No se encontraron datos en la tabla PatologiaApp" type="warning" />
        ) : (
          dynamoContents.map((item, index) => (
            <div key={index} style={{ marginBottom: 15, padding: 10, border: '1px solid #ddd', borderRadius: 5 }}>
              <Text strong>Colección: {item.NombreColeccion}</Text>
              <br />
              <Text type="secondary">ID: {item.ColeccionID}</Text>
              <br />
              <Text>Registros: {item.Registros?.length || 0}</Text>
              
              {item.Registros && item.Registros.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <Text strong>Primer registro:</Text>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 10, 
                    borderRadius: 3, 
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 200 
                  }}>
                    {JSON.stringify(item.Registros[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
      
      <Button 
        type="primary" 
        onClick={checkConnection}
        style={{ marginTop: 20 }}
      >
        🔄 Volver a Verificar
      </Button>
    </div>
  );
};