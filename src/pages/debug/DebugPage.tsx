// src/pages/debug/DebugPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Spin, 
  Alert, 
  Typography, 
  Descriptions, 
  Tag, 
  Space,
  Divider,
  Collapse
} from 'antd';
import { 
  ReloadOutlined, 
  DatabaseOutlined, 
  WarningOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import { DebugService } from '../../services/debugService';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export const DebugPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [info, stats, connection, collectionNames] = await Promise.all([
        DebugService.getDebugInfo(),
        DebugService.getDatabaseStats(),
        DebugService.testConnection(),
        DebugService.getCollectionNames()
      ]);

      setDebugInfo({
        ...info,
        stats,
        connection,
        collectionNames
      });
      
      setLastUpdated(new Date().toLocaleTimeString());
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionStatus = () => (
    <Card title="🔗 Estado de la Conexión" style={{ marginBottom: 20 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Tag 
          color={debugInfo?.connection ? 'green' : 'red'} 
          icon={debugInfo?.connection ? <CheckCircleOutlined /> : <WarningOutlined />}
          style={{ fontSize: '14px', padding: '8px' }}
        >
          {debugInfo?.connection ? 'CONECTADO A DYNAMODB' : 'ERROR DE CONEXIÓN'}
        </Tag>
        
        <Text type={debugInfo?.connection ? "success" : "danger"}>
          {debugInfo?.connectionStatus}
        </Text>
        
        {lastUpdated && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Última actualización: {lastUpdated}
          </Text>
        )}
      </Space>
    </Card>
  );

  const renderStatistics = () => (
    <Card title="📊 Estadísticas de la Base de Datos" style={{ marginBottom: 20 }}>
      <Descriptions bordered column={2} size="middle">
        <Descriptions.Item label="Total Colecciones">
          <Tag color="blue">{debugInfo?.stats?.totalCollections || 0}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Total Registros">
          <Tag color="purple">{debugInfo?.stats?.totalRecords || 0}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Colección Más Grande">
          <Tag color="orange">{debugInfo?.stats?.largestCollection || 'N/A'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Usuarios Registrados">
          <Tag color={debugInfo?.stats?.userCount > 0 ? 'green' : 'red'}>
            {debugInfo?.stats?.userCount || 0}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const renderCollections = () => (
    <Card title="📦 Colecciones Encontradas">
      {debugInfo?.collections?.length === 0 ? (
        <Alert message="No se encontraron colecciones" type="warning" />
      ) : (
        <Collapse accordion>
          {debugInfo?.collections?.map((collection: any, index: number) => (
            <Panel 
              key={index} 
              header={
                <Space>
                  <DatabaseOutlined />
                  <Text strong>{collection.name}</Text>
                  <Tag>{collection.recordCount} registros</Tag>
                </Space>
              }
            >
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="ID de Colección">
                  {debugInfo?.items?.[index]?.ColeccionID || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Registros en memoria">
                  {collection.recordCount}
                </Descriptions.Item>
                <Descriptions.Item label="Total en base de datos">
                  {collection.totalRecords || collection.recordCount}
                </Descriptions.Item>
              </Descriptions>

              {collection.sampleRecord && (
                <>
                  <Divider />
                  <Text strong>Ejemplo de registro:</Text>
                  <pre style={{
                    background: '#f6f8fa',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    border: '1px solid #e1e4e8',
                    marginTop: '10px'
                  }}>
                    {JSON.stringify(collection.sampleRecord, null, 2)}
                  </pre>
                </>
              )}
            </Panel>
          ))}
        </Collapse>
      )}
    </Card>
  );

  const renderError = () => (
    <Alert
      message="Error de Conexión"
      description={
        <div>
          <Paragraph>
            No se pudo conectar con la base de datos DynamoDB. Posibles causas:
          </Paragraph>
          <ul>
            <li>Credenciales de AWS incorrectas</li>
            <li>La tabla "PatologiaApp" no existe</li>
            <li>Problemas de red o conexión</li>
            <li>Permisos insuficientes</li>
          </ul>
          <Text type="secondary">
            Error detallado: {error}
          </Text>
        </div>
      }
      type="error"
      style={{ marginBottom: 20 }}
    />
  );

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" tip="Analizando base de datos..." />
        <Paragraph style={{ marginTop: 20 }}>
          Conectando con AWS DynamoDB...
        </Paragraph>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>
            <DatabaseOutlined /> Debug - Base de Datos DynamoDB
          </Title>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={loadDebugInfo}
            loading={loading}
          >
            Actualizar
          </Button>
        </Space>

        {/* Error */}
        {error && renderError()}

        {/* Contenido */}
        {!error && (
          <>
            {renderConnectionStatus()}
            {renderStatistics()}
            {renderCollections()}
          </>
        )}

        {/* Información adicional */}
        <Card title="💡 Información Útil" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              <strong>Tabla:</strong> PatologiaApp
            </Text>
            <Text>
              <strong>Región AWS:</strong> us-east-1
            </Text>
            <Text>
              <strong>Usuario requerido:</strong> Colección "dbo_Usuarios" con campos User y Password
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};