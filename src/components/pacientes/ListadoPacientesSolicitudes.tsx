// src/components/pacientes/ListadoPacientesSolicitudes.tsx
import { Table, Card, Statistic, Row, Col, Typography, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { SolicitudService } from '../../services/solicitudService';

const { Title } = Typography;

interface PacienteSolicitud {
  id: string;
  nombre: string;
  totalSolicitudes: number;
  primeraSolicitud: string;
  ultimaSolicitud: string;
  tipoEstudios: string[];
  medicos: string[];
  totalMonto: number;
  montoPromedio: number;
  procedencia?: string;
}

export const ListadoPacientesSolicitudes: React.FC = () => {
  const [pacientes, setPacientes] = useState<PacienteSolicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalPacientes: 0,
    totalSolicitudes: 0,
    montoTotal: 0
  });

  useEffect(() => {
    cargarPacientesSolicitudes();
  }, []);

  const cargarPacientesSolicitudes = async () => {
    try {
      setLoading(true);
      const result = await SolicitudService.obtenerPacientesDeSolicitudesCompleto();
      
      if (result.success && result.data) {
        setPacientes(result.data);
        
        // Calcular estadísticas
        const totalSolicitudes = result.data.reduce((sum, paciente) => sum + paciente.totalSolicitudes, 0);
        const montoTotal = result.data.reduce((sum, paciente) => sum + paciente.totalMonto, 0);
        
        setEstadisticas({
          totalPacientes: result.data.length,
          totalSolicitudes,
          montoTotal
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Paciente',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string, record: PacienteSolicitud) => (
        <div>
          <div><strong>{nombre}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Solicitudes',
      dataIndex: 'totalSolicitudes',
      key: 'totalSolicitudes',
      sorter: (a: PacienteSolicitud, b: PacienteSolicitud) => a.totalSolicitudes - b.totalSolicitudes,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Tipo de Estudios',
      dataIndex: 'tipoEstudios',
      key: 'tipoEstudios',
      render: (tipos: string[]) => (
        <div>
          {tipos.map((tipo, index) => (
            <Tag key={index} color="green" style={{ marginBottom: '2px' }}>
              {tipo}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Médicos',
      dataIndex: 'medicos',
      key: 'medicos',
      render: (medicos: string[]) => medicos.join(', '),
    },
    {
      title: 'Monto Total',
      dataIndex: 'totalMonto',
      key: 'totalMonto',
      render: (monto: number) => `$${monto.toLocaleString('es-MX')}`,
    },
    {
      title: 'Última Solicitud',
      dataIndex: 'ultimaSolicitud',
      key: 'ultimaSolicitud',
      render: (fecha: string) => new Date(fecha).toLocaleDateString('es-ES'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Pacientes con Solicitudes</Title>
      
      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Pacientes"
              value={estadisticas.totalPacientes}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Solicitudes"
              value={estadisticas.totalSolicitudes}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Monto Total"
              value={estadisticas.montoTotal}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Promedio por Paciente"
              value={estadisticas.totalMonto / estadisticas.totalPacientes}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de pacientes */}
      <Card>
        <Table
          dataSource={pacientes}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};