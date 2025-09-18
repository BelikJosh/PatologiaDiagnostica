import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Modal, 
  message, 
  Card, 
  Row, 
  Col,
  Tag,
  Space 
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { EmpleadoForm } from './EmpleadoForm';
import { EmpleadoService } from '../../services/empleadoService';

const { Search } = Input;

interface Empleado {
  Id: string;
  Nombre: string;
  ApellidoPat: string;
  ApellidoMat: string;
  FechaNacimiento: string;
  Telefono: string;
  Email: string;
  IdTipoUsuario: number;
  Activo: boolean;
  NombreUsuario: string;
  Avatar?: string;
  Direccion?: string;
  Puesto?: string;
  Sexo?: string;
}

export const EmpleadosPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [empleadosData, setEmpleadosData] = useState<Empleado[]>([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: 'ID',
      dataIndex: 'Id',
      key: 'Id',
      width: 100,
    },
    {
      title: 'Nombre',
      dataIndex: 'Nombre',
      key: 'Nombre',
      width: 120,
    },
    {
      title: '1er. apellido',
      dataIndex: 'ApellidoPat',
      key: 'ApellidoPat',
      width: 120,
    },
    {
      title: '2o. apellido',
      dataIndex: 'ApellidoMat',
      key: 'ApellidoMat',
      width: 120,
      render: (apellido: string) => apellido || '-',
    },
    {
      title: 'Fecha de nac.',
      dataIndex: 'FechaNacimiento',
      key: 'FechaNacimiento',
      width: 120,
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-',
    },
    {
      title: 'Teléfono',
      dataIndex: 'Telefono',
      key: 'Telefono',
      width: 100,
    },
    {
      title: 'Edad',
      key: 'Edad',
      width: 80,
      render: (record: Empleado) => (
        <Tag color="blue">
          {EmpleadoService.calcularEdad(record.FechaNacimiento)} años
        </Tag>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
      width: 150,
      render: (email: string) => email || '-',
    },
    {
      title: 'Tipo Usuario',
      key: 'TipoUsuario',
      width: 120,
      render: (record: Empleado) => {
        const tipos = {
          1: { label: 'Super Admin', color: 'red' },
          2: { label: 'Administrador', color: 'orange' },
          3: { label: 'Operador', color: 'green' }
        };
        const tipo = tipos[record.IdTipoUsuario as keyof typeof tipos] || { label: 'Desconocido', color: 'default' };
        return <Tag color={tipo.color}>{tipo.label}</Tag>;
      },
    },
    {
      title: 'Estado',
      key: 'Activo',
      width: 100,
      render: (record: Empleado) => (
        <Tag color={record.Activo ? 'green' : 'red'}>
          {record.Activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
  ];

  const loadEmpleados = async () => {
    setLoading(true);
    
    try {
      const isConnected = await EmpleadoService.testConnection();
      if (!isConnected) {
        message.error('No se pudo conectar a DynamoDB');
        setLoading(false);
        return;
      }
      
      const result = await EmpleadoService.getEmpleados();
      
      if (result.success && result.data) {
        // Asegurar que todos los campos tengan valores por defecto
        const empleadosProcesados = result.data.map(empleado => ({
          ...empleado,
          ApellidoMat: empleado.ApellidoMat || '',
          Email: empleado.Email || '',
          FechaNacimiento: empleado.FechaNacimiento || '',
          Activo: empleado.Activo !== undefined ? empleado.Activo : true
        }));
        
        setEmpleadosData(empleadosProcesados);
        setFilteredEmpleados(empleadosProcesados);
        message.success(`Cargados ${empleadosProcesados.length} empleados`);
      } else {
        message.error(result.error || 'Error al cargar empleados');
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      message.error('Error inesperado al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, []);

  // Filtrar empleados cuando cambia el texto de búsqueda
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredEmpleados(empleadosData);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    
    const filtered = empleadosData.filter(empleado => {
   const searchLower = searchText.toLowerCase().trim();
  
  // Convertir todos los campos a string antes de usar toLowerCase()
  const nombre = (empleado.Nombre || '').toString().toLowerCase();
  const apellidoPat = (empleado.ApellidoPat || '').toString().toLowerCase();
  const apellidoMat = (empleado.ApellidoMat || '').toString().toLowerCase();
  const telefono = (empleado.Telefono || '').toString();
  const email = (empleado.Email || '').toString().toLowerCase();
  const id = (empleado.Id || '').toString().toLowerCase();

      return (
 nombre.includes(searchLower) ||
    apellidoPat.includes(searchLower) ||
    apellidoMat.includes(searchLower) ||
    telefono.includes(searchLower) ||
    email.includes(searchLower) ||
    id.includes(searchLower)
      );
    });
    
    setFilteredEmpleados(filtered);
  }, [searchText, empleadosData]);

  const handleSuccess = () => {
    setOpenModal(false);
    // Recargar los empleados para incluir el nuevo
    loadEmpleados();
    message.success('Empleado agregado exitosamente');
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gestión de Empleados</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setOpenModal(true)}
        >
          Nuevo Empleado
        </Button>
      </div>

      {/* Panel de Búsqueda */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Búsqueda de Empleados
          </Space>
        } 
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16} lg={18}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Buscar empleados:</div>
              <Search
                placeholder="Buscar por nombre, apellido, teléfono, email..."
                allowClear
                enterButton={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={24} md={8} lg={6}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <span style={{ color: '#888' }}>
                Mostrando {filteredEmpleados.length} de {empleadosData.length} empleados
              </span>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Empleados */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredEmpleados}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} empleados`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          rowKey="Id"
        />
      </Card>

      {/* Modal para nuevo empleado */}
      <Modal
        title="Nuevo Empleado"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
        width={600}
        destroyOnClose={true}
      >
        <EmpleadoForm 
          onSuccess={handleSuccess} 
          onCancel={() => setOpenModal(false)} 
        />
      </Modal>
    </div>
  );
};

export default EmpleadosPage;