// src/components/solicitudes/CicloVidaSolicitud.tsx - VERSION SIMPLIFICADA
import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button,
  Tag,
  Space
} from 'antd';
import { 
  FileSearchOutlined, 
  ExperimentOutlined, 
  DownloadOutlined,
  UploadOutlined,
  FilePdfOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface CicloVidaSolicitudProps {
  solicitud: any;
  onIniciarMacroscopico: () => void;
  onIniciarMicroscopico: () => void;
  onDescargarEditable: () => void;
  onSubirDefinitivo: () => void;
  onDescargarPdf: () => void;
}

export const CicloVidaSolicitud: React.FC<CicloVidaSolicitudProps> = ({
  solicitud,
  onIniciarMacroscopico,
  onIniciarMicroscopico,
  onDescargarEditable,
  onSubirDefinitivo,
  onDescargarPdf
}) => {
  const currentStep = solicitud.idEstatusEstudio || 1;

  return (
    <Card title="Ciclo de Vida del Estudio" style={{ marginTop: 24 }}>
      <Row gutter={16}>
        {/* INICIADO - Estudio Macroscópico */}
        <Col span={6}>
          <Card 
            size="small" 
            style={{ 
              borderLeft: '4px solid #ff4d4f',
              height: '100%',
              textAlign: 'center'
            }}
          >
            <Tag color="red">INICIADO</Tag>
            <Title level={5} style={{ margin: '8px 0' }}>Estudio Macroscópico</Title>
            
            {currentStep === 1 ? (
              <Button 
                type="primary" 
                icon={<FileSearchOutlined />}
                onClick={onIniciarMacroscopico}
                style={{ marginTop: 8 }}
                block
              >
                Abrir
              </Button>
            ) : currentStep > 1 ? (
              <Tag color="green">Completado</Tag>
            ) : (
              <Text type="secondary">Pendiente</Text>
            )}
          </Card>
        </Col>

        {/* EN PROCESO - Estudio Microscópico */}
        <Col span={6}>
          <Card 
            size="small" 
            style={{ 
              borderLeft: '4px solid #faad14',
              height: '100%',
              textAlign: 'center'
            }}
          >
            <Tag color="orange">EN PROCESO</Tag>
            <Title level={5} style={{ margin: '8px 0' }}>Estudio Microscópico</Title>
            
            {currentStep === 2 ? (
              <Button 
                type="primary" 
                icon={<ExperimentOutlined />}
                onClick={onIniciarMicroscopico}
                style={{ marginTop: 8 }}
                block
              >
                Abrir
              </Button>
            ) : currentStep > 2 ? (
              <Tag color="green">Completado</Tag>
            ) : (
              <Text type="secondary">Pendiente</Text>
            )}
          </Card>
        </Col>

        {/* EN DIAGNÓSTICO - Documento Editable */}
        <Col span={6}>
          <Card 
            size="small" 
            style={{ 
              borderLeft: '4px solid #1890ff',
              height: '100%',
              textAlign: 'center'
            }}
          >
            <Tag color="blue">EN DIAGNÓSTICO</Tag>
            <Title level={5} style={{ margin: '8px 0' }}>Documento Editable</Title>
            
            {currentStep === 3 ? (
              <Space direction="vertical" style={{ marginTop: 8, width: '100%' }}>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={onDescargarEditable}
                  block
                >
                  Descargar editable
                </Button>
                <Button 
                  icon={<UploadOutlined />}
                  onClick={onSubirDefinitivo}
                  block
                >
                  Subir definitivo
                </Button>
              </Space>
            ) : currentStep > 3 ? (
              <Tag color="green">Completado</Tag>
            ) : (
              <Text type="secondary">Pendiente</Text>
            )}
          </Card>
        </Col>

        {/* FINALIZADO */}
        <Col span={6}>
          <Card 
            size="small" 
            style={{ 
              borderLeft: '4px solid #52c41a',
              height: '100%',
              textAlign: 'center'
            }}
          >
            <Tag color="green">FINALIZADO</Tag>
            <Title level={5} style={{ margin: '8px 0' }}>Entrega</Title>
            
            {currentStep === 4 ? (
              <Button 
                type="primary" 
                icon={<FilePdfOutlined />}
                onClick={onDescargarPdf}
                style={{ marginTop: 8 }}
                block
              >
                Descargar PDF
              </Button>
            ) : currentStep > 4 ? (
              <Tag color="green">Entregado</Tag>
            ) : (
              <Text type="secondary">Pendiente</Text>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
};