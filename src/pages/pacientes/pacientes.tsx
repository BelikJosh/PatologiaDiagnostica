// src/pages/pacientes/pacientes.tsx
import { Button, Input, Table, message, Card, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { DrawerUI } from '../../components/drawer/DrawerUI';
import { PacienteForm } from './PacienteForm';
import { PacienteService } from '../../services/PacienteService';

interface Paciente {
  id: string;
  nombre: string;
  apellidoPat: string;
  apellidoMat: string;
  telefono: string;
  email: string;
  direccion: string;
  sexo: string;
  fechaNacimiento: string;
  createdAt: string;
  // Agrega este campo
  documentosCount?: number;
}

export const PacientesPage = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarPacientesConConteo();
  }, []);

  const cargarPacientesConConteo = async () => {
    setLoading(true);
    try {
      const result = await PacienteService.obtenerPacientes();
      if (result.success && result.data) {
        // Cargar conteos de documentos para cada paciente
        const pacientesConConteo = await Promise.all(
          result.data.map(async (paciente) => {
            const count = await PacienteService.contarSolicitudesPorPaciente(paciente.id);
            return { ...paciente, documentosCount: count };
          })
        );
        setPacientes(pacientesConConteo);
      }
    } catch (error) {
      message.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const buscarPacientes = async (termino: string) => {
    setLoading(true);
    try {
      const result = await PacienteService.buscarPacientes(termino);
      if (result.success && result.data) {
        // También cargar conteos para los resultados de búsqueda
        const pacientesConConteo = await Promise.all(
          result.data.map(async (paciente) => {
            const count = await PacienteService.contarSolicitudesPorPaciente(paciente.id);
            return { ...paciente, documentosCount: count };
          })
        );
        setPacientes(pacientesConConteo);
      }
    } catch (error) {
      message.error('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  // COLUMNAS SIN HOOKS DENTRO
  const columns: ColumnsType<Paciente> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: 'Nombre Completo',
      key: 'nombreCompleto',
      width: 200,
      render: (_, record) => (
        <div>
          <div><strong>{record.nombre} {record.apellidoPat} {record.apellidoMat}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.telefono}</div>
        </div>
      ),
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (fecha) => new Date(fecha).toLocaleDateString('es-ES'),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 120,
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Edad',
      key: 'edad',
      width: 80,
      render: (_, record) => {
        if (!record.fechaNacimiento || record.fechaNacimiento === '2000-01-01') {
          return 'N/A';
        }
        try {
          const nacimiento = new Date(record.fechaNacimiento);
          const hoy = new Date();
          let edad = hoy.getFullYear() - nacimiento.getFullYear();
          
          // Ajustar si aún no ha pasado el cumpleaños este año
          if (hoy.getMonth() < nacimiento.getMonth() || 
              (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) {
            edad--;
          }
          
          return `${edad} años`;
        } catch {
          return 'N/A';
        }
      },
    },
    {
      title: 'Documentos',
      key: 'documentos',
      width: 120,
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => window.open(`/solicitudes-paciente/${record.id}`, '_blank')}
        >
          Ver ({record.documentosCount || 0})
        </Button>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small">Editar</Button>
          <Button icon={<EyeOutlined />} size="small">Ver</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2>Listado Maestro de Pacientes</h2>
          <Button type="primary" onClick={() => setOpenDrawer(true)}>
            Nuevo Paciente
          </Button>
        </div>

        <Input
          placeholder="Buscar pacientes por nombre, teléfono, email..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.trim() === '') {
              cargarPacientesConConteo();
            } else {
              buscarPacientes(e.target.value);
            }
          }}
          style={{ marginBottom: '16px' }}
        />

        <Table
          dataSource={pacientes}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />

        <DrawerUI
          title="Registro de Paciente"
          open={openDrawer}
          setOpen={() => setOpenDrawer(false)}
          size="default"
        >
          <PacienteForm 
            onSuccess={() => {
              setOpenDrawer(false);
              cargarPacientesConConteo();
              message.success('Paciente registrado correctamente');
            }}
          />
        </DrawerUI>
      </Card>
    </div>
  );
};