import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic,
  List,
  Tag,
  Typography,
  Button,
  Avatar,
  Space,
  Badge,
  Menu,
  Modal,
  message,
  Spin,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  ClockCircleOutlined, 
  DollarOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MenuOutlined,
  DashboardOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { SafeChart } from '../../components/SafeChart';
import DashboardService, { Solicitud, MetricasDashboard } from '../../services/dynamoDashboardService';

const { Title, Text } = Typography;

// Paleta de colores premium
const PREMIUM_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  purple: '#722ed1',
  cyan: '#13c2c2',
};

const GRADIENT_COLORS = {
  primary: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  success: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
  warning: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
};

// Datos de ejemplo como fallback
const datosEjemplo = {
  metricas: {
    totalSolicitudes: 156,
    concluidas: 112,
    enProceso: 28,
    pendientes: 16,
    ingresosTotales: 254800,
    eficiencia: 89,
    crecimiento: 12.5
  },
  ultimasSolicitudes: [
    {
      id: '1',
      paciente: 'María González',
      tipoEstudio: 'Biopsia de Mama',
      estatus: 'concluida',
      prioridad: 'alta',
      fechaSolicitud: '2025-09-15',
      medico: 'Dr. Carlos Ruiz',
      monto: 4500
    },
    {
      id: '2',
      paciente: 'Juan Pérez',
      tipoEstudio: 'Citología Cervical',
      estatus: 'proceso',
      prioridad: 'media',
      fechaSolicitud: '2025-09-15',
      medico: 'Dra. Ana Martínez',
      monto: 2800
    }
  ],
  estudiosData: [
    { name: 'Biopsias', value: 45, color: '#1890ff' },
    { name: 'Citologías', value: 30, color: '#52c41a' },
    { name: 'Histologías', value: 25, color: '#faad14' },
  ],
  ingresosData: [
    { month: 'Ene', ingresos: 42000, meta: 50000 },
    { month: 'Feb', ingresos: 48000, meta: 50000 },
    { month: 'Mar', ingresos: 52000, meta: 50000 },
    { month: 'Abr', ingresos: 45800, meta: 50000 },
    { month: 'May', ingresos: 53200, meta: 50000 },
    { month: 'Jun', ingresos: 61000, meta: 60000 },
    { month: 'Jul', ingresos: 58500, meta: 60000 },
  ],
  flujoEstudiosData: [
    { month: 'Ene', biopsias: 12, citologias: 18 },
    { month: 'Feb', biopsias: 15, citologias: 22 },
    { month: 'Mar', biopsias: 18, citologias: 20 },
    { month: 'Abr', biopsias: 10, citologias: 16 },
    { month: 'May', biopsias: 20, citologias: 25 },
    { month: 'Jun', biopsias: 22, citologias: 28 },
    { month: 'Jul', biopsias: 18, citologias: 24 },
  ]
};

export const HomeDashboard: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasDashboard>(datosEjemplo.metricas);
  const [ultimasSolicitudes, setUltimasSolicitudes] = useState<Solicitud[]>(datosEjemplo.ultimasSolicitudes);
  const [estudiosData, setEstudiosData] = useState(datosEjemplo.estudiosData);
  const [ingresosData, setIngresosData] = useState(datosEjemplo.ingresosData);
  const [flujoEstudiosData, setFlujoEstudiosData] = useState(datosEjemplo.flujoEstudiosData);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [reporteModalVisible, setReporteModalVisible] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      setUsingFallback(false);
      setError('');

      // Cargar datos reales desde DynamoDB
      const [metricasReales, solicitudesReales, datosGraficas] = await Promise.all([
        DashboardService.getMetricas(),
        DashboardService.getUltimasSolicitudes(5),
        DashboardService.getDatosGraficas()
      ]);

      setMetricas(metricasReales);
      setUltimasSolicitudes(solicitudesReales);
      
      // Asegurarse de que los datos sean válidos
      if (datosGraficas.estudiosData && Array.isArray(datosGraficas.estudiosData)) {
        setEstudiosData(datosGraficas.estudiosData);
      } else {
        setEstudiosData(datosEjemplo.estudiosData);
      }

      if (datosGraficas.ingresosData && Array.isArray(datosGraficas.ingresosData)) {
        setIngresosData(datosGraficas.ingresosData);
      } else {
        setIngresosData(datosEjemplo.ingresosData);
      }

      message.success('Datos actualizados correctamente');

    } catch (error) {
      console.error('❌ Error cargando datos reales:', error);
      setError('Error al cargar los datos. Mostrando información de ejemplo.');
      
      // Usar datos de ejemplo como fallback
      setMetricas(datosEjemplo.metricas);
      setUltimasSolicitudes(datosEjemplo.ultimasSolicitudes);
      setEstudiosData(datosEjemplo.estudiosData);
      setIngresosData(datosEjemplo.ingresosData);
      setFlujoEstudiosData(datosEjemplo.flujoEstudiosData);
      setUsingFallback(true);
      
      message.warning('Usando datos de ejemplo (modo demo)');
    } finally {
      setLoading(false);
    }
  };
  const generarReporteExcel = async () => {
    setGenerandoReporte(true);
    try {
      const result = await DashboardService.generarReporteExcel();
      
      if (result.success && result.data) {
        // En una implementación real, aquí descargarías el archivo Excel
        // Por ahora mostramos un modal de confirmación
        setReporteModalVisible(true);
        message.success('Reporte generado correctamente');
      } else {
        message.error(result.error || 'Error al generar el reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      message.error('Error al generar el reporte');
    } finally {
      setGenerandoReporte(false);
    }
  };

  const descargarReporteExcel = () => {
    // En una implementación real, esto descargaría el archivo Excel
    message.info('Función de descarga de Excel se implementará próximamente');
    setReporteModalVisible(false);
  };

  const getStatusTag = (estatus: string) => {
    const config = {
      concluida: { color: PREMIUM_COLORS.success, icon: <CheckCircleOutlined />, text: 'Concluida' },
      concluidas: { color: PREMIUM_COLORS.success, icon: <CheckCircleOutlined />, text: 'Concluida' },
      proceso: { color: PREMIUM_COLORS.warning, icon: <SyncOutlined spin />, text: 'En Proceso' },
      pendiente: { color: PREMIUM_COLORS.error, icon: <ClockCircleOutlined />, text: 'Pendiente' },
      completado: { color: PREMIUM_COLORS.success, icon: <CheckCircleOutlined />, text: 'Completado' }
    };
    
    const estatusLower = estatus.toLowerCase();
    let statusConfig = config.pendiente;

    if (estatusLower.includes('concluid')) statusConfig = config.concluida;
    else if (estatusLower.includes('proces')) statusConfig = config.proceso;
    else if (estatusLower.includes('complet')) statusConfig = config.completado;
    else if (estatusLower.includes('pendient')) statusConfig = config.pendiente;

    return (
      <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ borderRadius: 12, padding: '4px 8px' }}>
        {statusConfig.text}
      </Tag>
    );
  };

  const getPriorityBadge = (prioridad: string) => {
    const colors = {
      alta: PREMIUM_COLORS.error,
      media: PREMIUM_COLORS.warning,
      baja: PREMIUM_COLORS.success
    };
    
    return <Badge color={colors[prioridad as keyof typeof colors] || PREMIUM_COLORS.warning} />;
  };

  // Menú de navegación
  const menuItems = [
    {
      key: 'solicitudes',
      icon: <FileTextOutlined />,
      label: 'Solicitudes',
    },
    {
      key: 'doctores',
      icon: <UserOutlined />,
      label: 'Doctores',
    },
    {
      key: 'pacientes',
      icon: <TeamOutlined />,
      label: 'Pacientes',
    },
    {
      key: 'cuentas',
      icon: <DollarOutlined />,
      label: 'Cuentas',
    },
    {
      key: 'empleados',
      icon: <TeamOutlined />,
      label: 'Empleados',
    },
    {
      key: 'configuracion',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
  ];
 if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <Spin size="large" tip="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Header */}
      <Card 
        bordered={false} 
        style={{ 
          background: GRADIENT_COLORS.primary,
          marginBottom: 24,
          borderRadius: 16,
          color: 'white',
        }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              🏥 Dashboard de Patología
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {usingFallback ? 'Datos de ejemplo - ' : 'Datos en tiempo real - '}
              {new Date().toLocaleDateString('es-ES')}
            </Text>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={generarReporteExcel}
                loading={generandoReporte}
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                Reporte
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={cargarDatosDashboard}
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                Actualizar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Semáforo de estatus */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title="Total Solicitudes"
              value={metricas.totalSolicitudes}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: PREMIUM_COLORS.primary }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title="Concluidas"
              value={metricas.concluidas}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: PREMIUM_COLORS.success }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title="En Proceso"
              value={metricas.enProceso}
              prefix={<SyncOutlined />}
              valueStyle={{ color: PREMIUM_COLORS.warning }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title="Pendientes"
              value={metricas.pendientes}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: PREMIUM_COLORS.error }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficas */}
      <Row gutter={[16, 16]}>
        {/* Gráfico de Distribución de Estudios */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <MedicineBoxOutlined />
                <span>Distribución de Estudios</span>
              </Space>
            } 
            style={{ borderRadius: 16, height: 400 }}
          >
            <SafeChart data={estudiosData} height={350}>
              <PieChart>
                <Pie
                  data={estudiosData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {estudiosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </SafeChart>
          </Card>
        </Col>

        {/* Gráfico de Ingresos Mensuales */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <DollarOutlined />
                <span>Ingresos Mensuales</span>
              </Space>
            } 
            style={{ borderRadius: 16, height: 400 }}
          >
            <SafeChart data={ingresosData} height={350}>
              <BarChart data={ingresosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="ingresos" fill={PREMIUM_COLORS.primary} name="Ingresos" />
                <Bar dataKey="meta" fill={PREMIUM_COLORS.success} name="Meta" />
              </BarChart>
            </SafeChart>
          </Card>
        </Col>
      </Row>

      {/* Lista de últimas solicitudes */}
      <Row style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>Últimas Solicitudes</span>
              </Space>
            } 
            style={{ borderRadius: 16 }}
          >
            <List
              itemLayout="horizontal"
              dataSource={ultimasSolicitudes}
              renderItem={(solicitud) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{solicitud.paciente.charAt(0)}</Avatar>}
                    title={solicitud.paciente}
                    description={
                      <Space direction="vertical" size="small">
                        <Text>{solicitud.tipoEstudio}</Text>
                        <Space>
                          {getStatusTag(solicitud.estatus)}
                          <Text>{solicitud.medico}</Text>
                          <Text>{new Date(solicitud.fechaSolicitud).toLocaleDateString()}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};