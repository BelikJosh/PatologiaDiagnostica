// src/components/solicitudes/Solicitudes.tsx
import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Select, Card, Row, Col, Tag, Input } from 'antd';
import { PlusOutlined, FilterOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { SolicitudForm } from './SolicitudForm';
import { SolicitudService } from '../../services/solicitudService';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom'; // ← Importar useNavigate


const { Option } = Select;
const { Search } = Input;

interface SolicitudTable {
  key: string;
  id: string;
  paciente: string;
  medico: string;
  tipoEstudio: string;
  fechaRecepcion: string;
  estatus: string;
  precio: number;
  procedencia: string;
  hospital: string;
  factura: string;
}

export const Solicitudes = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudTable[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<SolicitudTable[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refresh, setRefresh] = useState(0);
  

  const handleVerDetalles = (solicitudId: string) => {
      console.log('📍 Navegando a solicitud:', solicitudId);

  window.location.href = `/dashboard/solicitudes-eventos/${solicitudId}`;
};


  // Estados para los filtros
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');
  const [filtroTipoEstudio, setFiltroTipoEstudio] = useState<string>('todos');
  const [searchText, setSearchText] = useState<string>('');

  const columns: ColumnsType<SolicitudTable> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Paciente',
      dataIndex: 'paciente',
      key: 'paciente',
      width: 150,
    },
    
    {
      title: 'Tipo de Estudio',
      dataIndex: 'tipoEstudio',
      key: 'tipoEstudio',
      width: 120,
      filters: [
        { text: 'Biopsia', value: 'BIOPSIA' },
        { text: 'Citología', value: 'CITOLOGÍA' },
      ],
      onFilter: (value, record) => record.tipoEstudio === value,
    },
    {
      title: 'Procedencia',
      dataIndex: 'procedencia',
      key: 'procedencia',
      width: 120,
      render: (procedencia: string) => procedencia || 'N/A',
    },
    {
      title: 'Hospital',
      dataIndex: 'hospital',
      key: 'hospital',
      width: 120,
      render: (hospital: string) => hospital || 'N/A',
    },
    {
      title: 'Factura',
      dataIndex: 'factura',
      key: 'factura',
      width: 100,
      render: (factura: string) => factura || 'N/A',
    },
    {
      title: 'Fecha Recepción',
      dataIndex: 'fechaRecepcion',
      key: 'fechaRecepcion',
      width: 120,
      sorter: (a, b) => new Date(a.fechaRecepcion).getTime() - new Date(b.fechaRecepcion).getTime(),
    },
    {
      title: 'Estatus',
      dataIndex: 'estatus',
      key: 'estatus',
      width: 150,
      render: (estatus: string) => {
        let color = 'default';
        let text = estatus;
        
        switch (estatus.toLowerCase()) {
          case 'iniciado':
            color = 'blue';
            break;
          case 'en proceso':
            color = 'orange';
            break;
          case 'en proceso de edicion':
            color = 'purple';
            text = 'En edición';
            break;
          case 'finalizado':
            color = 'green';
            break;
          case 'pendiente':
            color = 'gold';
            break;
          default:
            color = 'default';
        }
        
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Iniciado', value: 'Iniciado' },
        { text: 'En proceso', value: 'En proceso' },
        { text: 'En proceso de edición', value: 'En proceso de edicion' },
        { text: 'Finalizado', value: 'Finalizado' },
        { text: 'Pendiente', value: 'Pendiente' },
      ],
      onFilter: (value, record) => record.estatus === value,
    },
    
 // En tu Solicitudes.tsx, modifica la columna de acciones:
 {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalles(record.id)}
          >
            Detalles
          </Button>
          <Button size="small" type="primary" icon={<EditOutlined />}>
            Editar
          </Button>
        </Space>
      ),
    },
  ];

  const loadSolicitudes = async () => {
    setLoading(true);
    try {
      const result = await SolicitudService.getSolicitudes();
      
      if (result.success && result.data) {
        // Transformar datos de DynamoDB a formato de tabla con los nuevos campos
        const tableData: SolicitudTable[] = result.data.map((item: any) => ({
          key: item.Id || item.id || '',
          id: item.Id || item.id || 'N/A',
          paciente: item.PacienteNombre || item.pacienteNombre || 'N/A',
          medico: item.MedicoSolicitante || item.medicoSolicitante || 'N/A',
          tipoEstudio: item.TipoEstudio || item.tipoEstudio || 'N/A',
          fechaRecepcion: item.FechaRecepcion || item.fechaRecepcion || 'N/A',
          estatus: item.Estatus || item.estatus || 'Pendiente',
          precio: item.PrecioEstudio || item.precioEstudio || 0,
          procedencia: item.Procedencia || item.procedencia || 'N/A',
          hospital: item.Hospital || item.hospital || 'N/A',
          factura: item.Factura || item.factura || 'N/A',
        }));
        
        setSolicitudes(tableData);
        setFilteredSolicitudes(tableData);
        messageApi.success(`Cargadas ${tableData.length} solicitudes`);
      } else {
        messageApi.error(result.error || 'Error al cargar las solicitudes');
      }
    } catch (error) {
      console.error('Error loading solicitudes:', error);
      messageApi.error('Error de conexión con DynamoDB');
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar en todos los campos
  const searchInAllFields = (solicitud: SolicitudTable, searchValue: string): boolean => {
    if (!searchValue.trim()) return true;
    
    const searchLower = searchValue.toLowerCase();
    
    return (
      (solicitud.id && solicitud.id.toLowerCase().includes(searchLower)) ||
      (solicitud.paciente && solicitud.paciente.toLowerCase().includes(searchLower)) ||
      (solicitud.medico && solicitud.medico.toLowerCase().includes(searchLower)) ||
      (solicitud.tipoEstudio && solicitud.tipoEstudio.toLowerCase().includes(searchLower)) ||
      (solicitud.estatus && solicitud.estatus.toLowerCase().includes(searchLower)) ||
      (solicitud.fechaRecepcion && solicitud.fechaRecepcion.toLowerCase().includes(searchLower)) ||
      (solicitud.precio && solicitud.precio.toString().includes(searchLower)) ||
      (solicitud.procedencia && solicitud.procedencia.toLowerCase().includes(searchLower)) ||
      (solicitud.hospital && solicitud.hospital.toLowerCase().includes(searchLower)) ||
      (solicitud.factura && solicitud.factura.toLowerCase().includes(searchLower))
    );
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = solicitudes;
    
    // Filtrar por estatus
    if (filtroEstatus !== 'todos') {
      filtered = filtered.filter(solicitud => 
        solicitud.estatus.toLowerCase() === filtroEstatus.toLowerCase()
      );
    }
    
    // Filtrar por tipo de estudio
    if (filtroTipoEstudio !== 'todos') {
      filtered = filtered.filter(solicitud => 
        solicitud.tipoEstudio.toLowerCase() === filtroTipoEstudio.toLowerCase()
      );
    }
    
    // Filtrar por texto de búsqueda
    if (searchText) {
      filtered = filtered.filter(solicitud => 
        searchInAllFields(solicitud, searchText)
      );
    }
    
    setFilteredSolicitudes(filtered);
  }, [filtroEstatus, filtroTipoEstudio, searchText, solicitudes]);

  useEffect(() => {
    loadSolicitudes();
  }, [refresh]);

  const handleSuccess = () => {
    if (messageApi && typeof messageApi.success === 'function') {
      messageApi.success('Solicitud guardada exitosamente');
    } 
    
    else {
      console.log('Solicitud guardada exitosamente');
    }
    setShowForm(false);
    setRefresh(prev => prev + 1);
  };

  const handleNewPatient = () => {
    if (messageApi && typeof messageApi.info === 'function') {
      messageApi.info('Funcionalidad de nuevo paciente');
    }
  };

  const handleNewDoctor = () => {
    if (messageApi && typeof messageApi.info === 'function') {
      messageApi.info('Funcionalidad de nuevo médico');
    }
  };

  const handleResetFilters = () => {
    setFiltroEstatus('todos');
    setFiltroTipoEstudio('todos');
    setSearchText('');
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <div>
      {contextHolder}
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Solicitudes de Estudio</h2>
        
      </div>

      {/* Panel de Filtros */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Filtros y Búsqueda
          </Space>
        } 
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
          <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setShowForm(true)}
        >
          Nueva Solicitud
        </Button>
            <div>
              
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Estatus:</div>
              <Select
                value={filtroEstatus}
                onChange={setFiltroEstatus}
                style={{ width: '100%' }}
                placeholder="Filtrar por estatus"
              >
                <Option value="todos">Todos los estatus</Option>
                <Option value="Iniciado">Iniciado</Option>
                <Option value="En proceso">En proceso</Option>
                <Option value="En proceso de edicion">En proceso de edición</Option>
                <Option value="Finalizado">Finalizado</Option>
                <Option value="Pendiente">Pendiente</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Tipo de Estudio:</div>
              <Select
                value={filtroTipoEstudio}
                onChange={setFiltroTipoEstudio}
                style={{ width: '100%' }}
                placeholder="Filtrar por tipo"
              >
                <Option value="todos">Todos los tipos</Option>
                <Option value="BIOPSIA">Biopsia</Option>
                <Option value="CITOLOGÍA">Citología</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={24} md={8} lg={12}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Búsqueda general:</div>
              <Search
                placeholder="Buscar en todos los campos..."
                allowClear
                enterButton={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
        </Row>
        
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space>
              <Button 
                onClick={handleResetFilters}
                style={{ marginRight: 8 }}
              >
                Limpiar Todos los Filtros
              </Button>
              <span style={{ color: '#888' }}>
                Mostrando {filteredSolicitudes.length} de {solicitudes.length} registros
              </span>
            </Space>
          </Col>
        </Row>
        
        {/* Sugerencias de búsqueda */}
        {searchText && (
          <Row style={{ marginTop: 8 }}>
            <Col span={24}>
              <small style={{ color: '#666' }}>
                💡 Buscando: "{searchText}" en ID, paciente, médico, tipo de estudio, estatus, fecha, precio, procedencia, hospital y factura
              </small>
            </Col>
          </Row>
        )}
      </Card>

      <Table
        columns={columns}
        dataSource={filteredSolicitudes}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} de ${total} registros`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        scroll={{ x: 1500 }}
        bordered
        size="middle"
      />

      <Modal
        title="Nueva Solicitud"
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <SolicitudForm
          onNewPatient={handleNewPatient}
          onNewDoctor={handleNewDoctor}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  );
};