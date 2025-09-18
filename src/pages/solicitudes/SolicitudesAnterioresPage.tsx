// src/components/solicitudes/SolicitudesAnterioresPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Dropdown,
  Modal,
  message,
  Alert,
  Spin
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { SolicitudesAnterioresService, SolicitudAnterior } from '../../services/solicitudesAnterioresService';

const { Option } = Select;

export const SolicitudesAnterioresPage = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudAnterior[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<SolicitudAnterior[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'todos'>('todos');
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'Biopsia' | 'Citologia'>('todos');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudAnterior | null>(null);

  // Cargar solicitudes al montar el componente
  useEffect(() => {
    checkConnectionAndLoadData();
  }, []);

  // Aplicar filtros cuando cambian los parámetros
  useEffect(() => {
    aplicarFiltros();
  }, [solicitudes, searchText, selectedYear, selectedTipo]);

  // Función para verificar conexión y cargar datos
  const checkConnectionAndLoadData = async () => {
    setLoading(true);
    setConnectionStatus('checking');
    
    try {
      const connectionResult = await SolicitudesAnterioresService.verifyConnection();
      
      if (connectionResult.success) {
        setConnectionStatus('connected');
        await cargarSolicitudes();
      } else {
        setConnectionStatus('error');
        message.error('Error de conexión: ' + connectionResult.error);
      }
    } catch (error) {
      console.error('Error verificando conexión:', error);
      setConnectionStatus('error');
      message.error('Error inesperado al verificar la conexión');
    } finally {
      setLoading(false);
    }
  };

  // Cargar solicitudes desde DynamoDB
 // En tu componente SolicitudesAnterioresPage.tsx, modifica la función cargarSolicitudes:
const cargarSolicitudes = async () => {
  try {
    let result;
    
    if (selectedYear !== 'todos') {
      result = await SolicitudesAnterioresService.getSolicitudesPorAño(selectedYear as number);
    } else {
      result = await SolicitudesAnterioresService.getSolicitudes();
    }
    
    if (result.success && result.data) {
      setSolicitudes(result.data);
      if (result.data.length === 0) {
        message.info('No se encontraron solicitudes en la base de datos');
      } else {
        message.success(`Datos cargados: ${result.data.length} registros encontrados`);
      }
    } else {
      message.warning(result.error || 'Error al cargar las solicitudes');
      // Fallback a datos de ejemplo
      const datosEjemplo = SolicitudesAnterioresService.getDatosEjemplo();
      setSolicitudes(datosEjemplo);
      message.info('Mostrando datos de ejemplo para desarrollo');
    }
  } catch (error) {
    console.error('Error cargando solicitudes:', error);
    message.error('Error inesperado al cargar las solicitudes');
    // Fallback a datos de ejemplo
    const datosEjemplo = SolicitudesAnterioresService.getDatosEjemplo();
    setSolicitudes(datosEjemplo);
    message.info('Mostrando datos de ejemplo debido al error');
  }
};
  // Aplicar filtros a los datos
  const aplicarFiltros = () => {
    let filtered = [...solicitudes];

    // Filtrar por año
    if (selectedYear !== 'todos') {
      filtered = filtered.filter(s => s.año === selectedYear);
    }

    // Filtrar por tipo de estudio
    if (selectedTipo !== 'todos') {
      filtered = filtered.filter(s => s.tipoEstudio === selectedTipo);
    }

    // Filtrar por texto de búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.numeroRegistro.toLowerCase().includes(searchLower) ||
        s.paciente.toLowerCase().includes(searchLower) ||
        s.procedencia.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSolicitudes(filtered);
  };

  // Manejar cambio de año
  const handleYearChange = async (year: number | 'todos') => {
    setSelectedYear(year);
    setLoading(true);
    
    try {
      if (year === 'todos') {
        const result = await SolicitudesAnterioresService.getSolicitudes();
        if (result.success && result.data) {
          setSolicitudes(result.data);
        }
      } else {
        const result = await SolicitudesAnterioresService.getSolicitudesPorAño(year);
        if (result.success && result.data) {
          setSolicitudes(result.data);
        }
      }
    } catch (error) {
      console.error('Error cambiando año:', error);
      message.error('Error al cargar los datos del año seleccionado');
    } finally {
      setLoading(false);
    }
  };

  // Manejar ver solicitud
  const handleVerSolicitud = (solicitud: SolicitudAnterior) => {
    if (solicitud.archivoUrl) {
      window.open(solicitud.archivoUrl, '_blank');
    } else {
      message.info('No hay archivo disponible para esta solicitud');
    }
  };

  // Manejar descarga
  const handleDescargar = async (solicitud: SolicitudAnterior) => {
    if (solicitud.archivoUrl) {
      try {
        const result = await SolicitudesAnterioresService.descargarArchivo(solicitud.numeroRegistro);
        if (result.success) {
          // Simular descarga
          const link = document.createElement('a');
          link.href = solicitud.archivoUrl!;
          link.download = `${solicitud.numeroRegistro}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          message.success('Descargando archivo...');
        } else {
          message.error(result.error || 'Error al descargar el archivo');
        }
      } catch (error) {
        console.error('Error descargando archivo:', error);
        message.error('Error al descargar el archivo');
      }
    } else {
      message.info('No hay archivo disponible para descargar');
    }
  };

  // Manejar eliminación
  const handleEliminar = (solicitud: SolicitudAnterior) => {
    setSelectedSolicitud(solicitud);
    setDeleteModalVisible(true);
  };

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (selectedSolicitud) {
      try {
        const result = await SolicitudesAnterioresService.eliminarSolicitud(selectedSolicitud.id);
        
        if (result.success) {
          setSolicitudes(prev => prev.filter(s => s.id !== selectedSolicitud.id));
          message.success('Solicitud eliminada correctamente');
        } else {
          message.error(result.error || 'Error al eliminar la solicitud');
        }
      } catch (error) {
        console.error('Error eliminando solicitud:', error);
        message.error('Error al eliminar la solicitud');
      } finally {
        setDeleteModalVisible(false);
        setSelectedSolicitud(null);
      }
    }
  };

  // Elementos del menú desplegable
  const getMenuItems = (solicitud: SolicitudAnterior): MenuProps['items'] => [
    {
      key: '1',
      label: 'Ver',
      icon: <EyeOutlined />,
      onClick: () => handleVerSolicitud(solicitud)
    },
    {
      key: '2',
      label: 'Descargar',
      icon: <DownloadOutlined />,
      onClick: () => handleDescargar(solicitud),
      disabled: !solicitud.archivoUrl
    },
    {
      key: '3',
      label: 'Eliminar',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleEliminar(solicitud)
    }
  ];

  // Columnas de la tabla
  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (id: string) => id
    },
    {
      title: 'Número de Registro',
      dataIndex: 'numeroRegistro',
      key: 'numeroRegistro',
      render: (numero: string, record: SolicitudAnterior) => (
        <a 
          onClick={() => handleVerSolicitud(record)}
          style={{ cursor: 'pointer', color: '#1890ff' }}
        >
          {numero}
        </a>
      )
    },
    {
      title: 'Paciente',
      dataIndex: 'paciente',
      key: 'paciente'
    },
    {
      title: 'Fecha Alta',
      dataIndex: 'fechaAlta',
      key: 'fechaAlta'
    },
    {
      title: 'Tipo de Estudio',
      dataIndex: 'tipoEstudio',
      key: 'tipoEstudio',
      render: (tipo: string) => (
        <Tag color={tipo === 'Biopsia' ? 'blue' : 'cyan'}>
          {tipo}
        </Tag>
      )
    },
    {
      title: 'Procedencia',
      dataIndex: 'procedencia',
      key: 'procedencia'
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 100,
      render: (_: any, record: SolicitudAnterior) => (
        <Dropdown
          menu={{ items: getMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<FilterOutlined />} />
        </Dropdown>
      )
    }
  ];

  // Generar opciones de años dinámicamente
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 2020; year--) {
    yearOptions.push(year);
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <h2>Ver Solicitudes Anteriores</h2>
        </Col>
      </Row>

      {/* Estado de conexión */}
      {connectionStatus === 'checking' && (
        <Alert 
          message="Verificando conexión con DynamoDB..." 
          type="info" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}
      
      {connectionStatus === 'error' && (
        <Alert 
          message={
            <div>
              <p>Error de conexión con DynamoDB</p>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={checkConnectionAndLoadData}
                style={{ marginTop: 8 }}
              >
                Reintentar conexión
              </Button>
            </div>
          } 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}
      
      {connectionStatus === 'connected' && (
        <Alert 
          message="Conectado a DynamoDB correctamente" 
          type="success" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Buscar Solicitud:</div>
              <Input
                placeholder="Buscar por número, paciente, procedencia..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Año:</div>
              <Select
                value={selectedYear}
                onChange={handleYearChange}
                style={{ width: '100%' }}
                loading={loading}
              >
                <Option value="todos">Todos los años</Option>
                {yearOptions.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={24} md={8} lg={12}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Filtrar por tipo:</div>
              <Space>
                <Button
                  type={selectedTipo === 'todos' ? 'primary' : 'default'}
                  onClick={() => setSelectedTipo('todos')}
                >
                  Todos
                </Button>
                <Button
                  type={selectedTipo === 'Biopsia' ? 'primary' : 'default'}
                  style={{ backgroundColor: selectedTipo === 'Biopsia' ? '#08979c' : undefined, color: selectedTipo === 'Biopsia' ? 'white' : undefined }}
                  onClick={() => setSelectedTipo('Biopsia')}
                >
                  Solo Biopsias
                </Button>
                <Button
                  type={selectedTipo === 'Citologia' ? 'primary' : 'default'}
                  style={{ backgroundColor: selectedTipo === 'Citologia' ? '#36cfc9' : undefined, color: selectedTipo === 'Citologia' ? 'white' : undefined }}
                  onClick={() => setSelectedTipo('Citologia')}
                >
                  Solo Citologías
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabla */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span>
            Mostrando {filteredSolicitudes.length} de {solicitudes.length} registros
          </span>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={checkConnectionAndLoadData}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Cargando datos...</div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredSolicitudes}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} registros`,
              pageSizeOptions: ['10', '20', '50']
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Modal de confirmación para eliminar */}
      <Modal
        title="Confirmar Eliminación"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={confirmarEliminar}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que deseas eliminar la solicitud <strong>{selectedSolicitud?.numeroRegistro}</strong>?</p>
        <p>Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};