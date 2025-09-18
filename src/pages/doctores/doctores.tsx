// src/components/doctores/DoctoresPage.tsx
import { Button, Input, Table, message, Space, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { AnyObject } from 'antd/es/_util/type';
import { DoctorForm } from './DoctorForm';
import { DoctorService } from '../../services/doctorService';

const columns: ColumnsType<AnyObject> = [
  {
    title: 'ID',
    dataIndex: 'Id',
    key: 'id',
    sorter: (a, b) => a.Id?.localeCompare(b.Id),
  },
  {
    title: 'Nombre',
    dataIndex: 'Nombre',
    key: 'nombre',
    sorter: (a, b) => a.Nombre?.localeCompare(b.Nombre),
  },
  {
    title: '1er. apellido',
    dataIndex: 'PrimerApellido',
    key: 'primerApellido',
    sorter: (a, b) => a.PrimerApellido?.localeCompare(b.PrimerApellido),
  },
  {
    title: '2o. apellido',
    dataIndex: 'SegundoApellido',
    key: 'segundoApellido',
    sorter: (a, b) => a.SegundoApellido?.localeCompare(b.SegundoApellido),
  },
  {
    title: 'Email',
    dataIndex: 'Email',
    key: 'email',
  },
  {
    title: 'Teléfono',
    dataIndex: 'Telefono',
    key: 'telefono',
  },
  {
    title: 'Especialidad',
    dataIndex: 'Especialidad',
    key: 'especialidad',
    sorter: (a, b) => a.Especialidad?.localeCompare(b.Especialidad),
  },
];

export const DoctoresPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [doctoresData, setDoctoresData] = useState([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadDoctores = async () => {
    setLoadingDoctores(true);
    try {
      const result = await DoctorService.getDoctores();
      
      if (result.success && result.data) {
        setDoctoresData(result.data);
      } else {
        message.error(result.error || 'Error al cargar los doctores');
      }
    } catch (error) {
      console.error(error);
      message.error('Error al cargar los doctores');
    } finally {
      setLoadingDoctores(false);
    }
  };

  useEffect(() => {
    loadDoctores();
  }, []);

  const filteredData = doctoresData.filter((item: AnyObject) =>
    Object.values(item).some(val =>
      val?.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const handleSuccess = () => {
    setOpenModal(false);
    loadDoctores();
    message.success('Doctor agregado exitosamente');
  };

  return (
    <>
      <h4>Doctores</h4>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setOpenModal(true)}
        >
          Nuevo Doctor
        </Button>
        <Input
          placeholder="Buscar doctores..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
      </Space>
      
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="Id"
        loading={loadingDoctores}
        pagination={{ pageSize: 10 }}
      />
      
      <Modal
        title="Registro de Doctor"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
        width={600}
      >
        <DoctorForm onSuccess={handleSuccess} onCancel={() => setOpenModal(false)} />
      </Modal>
    </>
  );
};