// src/components/cuentas/Cuentas.tsx
import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, message, Modal, Card, Row, Col, Tag, Input, 
  Form, InputNumber, Select, Tooltip , Descriptions 
} from 'antd';
import { 
  FilterOutlined, SearchOutlined, DollarOutlined, FileTextOutlined,
  ReloadOutlined, EyeOutlined 
} from '@ant-design/icons';
import { CuentasService } from '../../services/cuentasService';

const { Search } = Input;
const { Option } = Select;

interface CuentaTable {
   key: string;
  id: string;
  numeroRegistro: string;
  paciente: string;
  fechaAlta: string;
  precio: number;
  precioEstudioEspecial: number;
  pagado: number;
  factura: string;
  estatus: string;
  acciones: any;
  pagos?: any[];
}

export const CuentasPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaTable[]>([]);
  const [filteredCuentas, setFilteredCuentas] = useState<CuentaTable[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [isDetallesModalOpen, setIsDetallesModalOpen] = useState(false);

  // Estados para los filtros de cuentas
  const [searchTextCuentas, setSearchTextCuentas] = useState<string>('');
  const [filtroFactura, setFiltroFactura] = useState<string>('todos');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');

  // Estados para los modales
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaTable | null>(null);
  const [formPago] = Form.useForm();
  const [formFactura] = Form.useForm();

  const columnsCuentas = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
      sorter: (a: CuentaTable, b: CuentaTable) => a.id.localeCompare(b.id),
    },
    {
      title: 'Número de Registro',
      dataIndex: 'numeroRegistro',
      key: 'numeroRegistro',
      width: 120,
      sorter: (a: CuentaTable, b: CuentaTable) => a.numeroRegistro.localeCompare(b.numeroRegistro),
    },
    {
      title: 'Paciente',
      dataIndex: 'paciente',
      key: 'paciente',
      width: 150,
      sorter: (a: CuentaTable, b: CuentaTable) => a.paciente.localeCompare(b.paciente),
    },
    {
      title: 'Fecha Alta',
      dataIndex: 'fechaAlta',
      key: 'fechaAlta',
      width: 120,
      render: (fecha: string) => new Date(fecha).toLocaleDateString('es-ES'),
      sorter: (a: CuentaTable, b: CuentaTable) => 
        new Date(a.fechaAlta).getTime() - new Date(b.fechaAlta).getTime(),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      width: 100,
      render: (precio: number) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {formatCurrency(precio)}
        </Tag>
      ),
      sorter: (a: CuentaTable, b: CuentaTable) => a.precio - b.precio,
    },
    {
      title: 'Precio Estudio Especial',
      dataIndex: 'precioEstudioEspecial',
      key: 'precioEstudioEspecial',
      width: 120,
      render: (precio: number) => (
        <Tag color="purple" style={{ margin: 0 }}>
          {formatCurrency(precio)}
        </Tag>
      ),
      sorter: (a: CuentaTable, b: CuentaTable) => a.precioEstudioEspecial - b.precioEstudioEspecial,
    },
    {
      title: 'Pagado',
      dataIndex: 'pagado',
      key: 'pagado',
      width: 100,
      render: (pagado: number, record: CuentaTable) => (
        <Tag color={pagado === record.precio ? "green" : "orange"} style={{ margin: 0 }}>
          {formatCurrency(pagado)}
        </Tag>
      ),
      sorter: (a: CuentaTable, b: CuentaTable) => a.pagado - b.pagado,
    },
    {
      title: 'Factura',
      dataIndex: 'factura',
      key: 'factura',
      width: 100,
      render: (factura: string) => (
        <Tag 
          color={factura === 'INGADO' ? 'green' : factura === 'PROCESO DE INGO' ? 'orange' : 'red'} 
          style={{ margin: 0, cursor: 'pointer' }}
          onClick={() => openFacturaModal(findCuentaByFactura(factura))}
        >
          {factura || 'Sin factura'}
        </Tag>
      ),
      sorter: (a: CuentaTable, b: CuentaTable) => (a.factura || '').localeCompare(b.factura || ''),
    },
    {
      title: 'Estatus',
      dataIndex: 'estatus',
      key: 'estatus',
      width: 120,
      render: (estatus: string) => {
        let color = 'default';
        let text = estatus;
        
        switch (estatus.toLowerCase()) {
          case 'pagado': 
            color = 'green'; 
            text = 'PAGADO';
            break;
          case 'en proceso': 
          case 'en proceso de pago': 
            color = 'orange'; 
            text = 'EN PROCESO DE PAGO';
            break;
          case 'pendiente': 
            color = 'red'; 
            text = 'PENDIENTE';
            break;
          default: 
            color = 'default';
        }
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'PAGADO', value: 'pagado' },
        { text: 'EN PROCESO DE PAGO', value: 'en proceso' },
        { text: 'PENDIENTE', value: 'pendiente' },
      ],
      onFilter: (value: string | number | boolean, record: CuentaTable) => 
        record.estatus.toLowerCase().includes(value.toString().toLowerCase()),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button 
              size="small" 
              type="default"
              onClick={() => openDetallesModal(record)}
              icon={<EyeOutlined />}
            >
              Detalles
            </Button>
          </Tooltip>
          <Tooltip title="Actualizar factura">
            <Button 
              size="small" 
              type="default"
              onClick={() => openFacturaModal(record)}
              icon={<FileTextOutlined />}
            >
              Factura
            </Button>
          </Tooltip>
          {record.pagado < record.precio && (
            <Tooltip title="Agregar pago">
              <Button 
                size="small" 
                type="primary" 
                icon={<DollarOutlined />}
                onClick={() => openPagoModal(record)}
              >
                Pago
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const loadCuentas = async () => {
    setLoadingCuentas(true);
    try {
      const result = await CuentasService.getCuentas();
      
      if (result.success && result.data) {
        const cuentasData: CuentaTable[] = result.data.map((item: any) => ({
          key: item.Id?.toString() || Math.random().toString(),
          id: item.Id?.toString() || 'N/A',
          numeroRegistro: item.NumeroRegistro || 'N/A',
          paciente: item.PacienteNombre || 'Nombre no disponible',
          fechaAlta: item.FechaRecepcion || item.CreatedAt || new Date().toISOString(),
          precio: item.PrecioEstudio || 0,
          precioEstudioEspecial: item.PrecioEstudioEspecial || 0,
          pagado: item.TotalPagado || 0,
          factura: item.Factura || '',
          estatus: item.EstatusPago || 'pendiente',
          pagos: item.Pagos || [],
          acciones: null
        }));
        
        setCuentas(cuentasData);
        setFilteredCuentas(cuentasData);
        messageApi.success(`Cargadas ${cuentasData.length} cuentas`);
      } else {
        messageApi.error(result.error || 'Error al cargar las cuentas');
      }
    } catch (error) {
      console.error('Error loading cuentas:', error);
      messageApi.error('Error al cargar las cuentas');
    } finally {
      setLoadingCuentas(false);
    }
  };


  const findCuentaByFactura = (factura: string) => {
    return cuentas.find(cuenta => cuenta.factura === factura) || null;
  };

  const searchInAllFieldsCuentas = (cuenta: CuentaTable, searchValue: string): boolean => {
    if (!searchValue.trim()) return true;
    
    const searchLower = searchValue.toLowerCase();
    
    return (
      (cuenta.id && cuenta.id.toLowerCase().includes(searchLower)) ||
      (cuenta.numeroRegistro && cuenta.numeroRegistro.toLowerCase().includes(searchLower)) ||
      (cuenta.paciente && cuenta.paciente.toLowerCase().includes(searchLower)) ||
      (cuenta.fechaAlta && cuenta.fechaAlta.toLowerCase().includes(searchLower)) ||
      (cuenta.precio && cuenta.precio.toString().includes(searchLower)) ||
      (cuenta.precioEstudioEspecial && cuenta.precioEstudioEspecial.toString().includes(searchLower)) ||
      (cuenta.pagado && cuenta.pagado.toString().includes(searchLower)) ||
      (cuenta.factura && cuenta.factura.toLowerCase().includes(searchLower)) ||
      (cuenta.estatus && cuenta.estatus.toLowerCase().includes(searchLower))
    );
  };

  // Aplicar filtros a cuentas
  useEffect(() => {
    let filtered = cuentas;
    
    // Filtrar por texto de búsqueda
    if (searchTextCuentas) {
      filtered = filtered.filter(cuenta => 
        searchInAllFieldsCuentas(cuenta, searchTextCuentas)
      );
    }
    
    // Filtrar por estado de factura
    if (filtroFactura !== 'todos') {
      filtered = filtered.filter(cuenta => 
        filtroFactura === 'pagado' 
          ? cuenta.factura === 'INGADO'
          : cuenta.factura !== 'INGADO'
      );
    }
    
    // Filtrar por estatus
    if (filtroEstatus !== 'todos') {
      filtered = filtered.filter(cuenta => 
        cuenta.estatus.toLowerCase() === filtroEstatus.toLowerCase()
      );
    }
    
    setFilteredCuentas(filtered);
  }, [searchTextCuentas, filtroFactura, filtroEstatus, cuentas]);

  useEffect(() => {
    loadCuentas();
  }, [refresh]);

  const handleResetFilters = () => {
    setSearchTextCuentas('');
    setFiltroFactura('todos');
    setFiltroEstatus('todos');
  };

  const handleSearchCuentas = (value: string) => {
    setSearchTextCuentas(value);
  };

  const openPagoModal = (cuenta: CuentaTable) => {
    setSelectedCuenta(cuenta);
    setIsPagoModalOpen(true);
    formPago.setFieldsValue({ 
      montoPago: cuenta.precio - cuenta.pagado,
      tipoPago: 1 // Valor por defecto
    });
  };

  const openFacturaModal = (cuenta: CuentaTable | null) => {
    if (cuenta) {
      setSelectedCuenta(cuenta);
      setIsFacturaModalOpen(true);
      formFactura.setFieldsValue({ factura: cuenta.factura });
    }
  };

  const closePagoModal = () => {
    setIsPagoModalOpen(false);
    setSelectedCuenta(null);
    formPago.resetFields();
  };

  const closeFacturaModal = () => {
    setIsFacturaModalOpen(false);
    setSelectedCuenta(null);
    formFactura.resetFields();
  };

 const handleAddPago = async (values: any) => {
    if (!selectedCuenta) return;

    try {
      const result = await CuentasService.registrarPago(
        selectedCuenta.id, 
        values.montoPago,
        values.tipoPago,
        values.descripcion
      );
      
      if (result.success) {
        messageApi.success(`Pago de ${formatCurrency(values.montoPago)} registrado exitosamente`);
        closePagoModal();
        setRefresh(prev => prev + 1); // Recargar cuentas
      } else {
        messageApi.error(result.error || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      messageApi.error('Error al procesar el pago');
    }
  };

  const handleUpdateFactura = async (values: any) => {
    if (!selectedCuenta) return;

    try {
      const result = await CuentasService.actualizarFactura(
        selectedCuenta.id, 
        values.factura
      );
      
      if (result.success) {
        messageApi.success('Factura actualizada exitosamente');
        closeFacturaModal();
        setRefresh(prev => prev + 1); // Recargar cuentas
      } else {
        messageApi.error(result.error || 'Error al actualizar la factura');
      }
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      messageApi.error('Error al actualizar la factura');
    }
  };

    // Modal para ver detalles de pagos
  const openDetallesModal = (cuenta: CuentaTable) => {
    setSelectedCuenta(cuenta);
    setIsDetallesModalOpen(true);
  };

  const closeDetallesModal = () => {
    setIsDetallesModalOpen(false);
    setSelectedCuenta(null);
  };
  return (
    <div>
      {contextHolder}
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gestión de Cuentas y Pagos</h2>
        <Button 
          type="primary" 
          onClick={() => setRefresh(prev => prev + 1)}
          loading={loadingCuentas}
          icon={<ReloadOutlined />}
        >
          Actualizar
        </Button>
      </div>

      {/* Panel de Búsqueda para Cuentas */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Búsqueda y Filtros
          </Space>
        } 
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Estado de Factura:</div>
              <Select
                value={filtroFactura}
                onChange={setFiltroFactura}
                style={{ width: '100%' }}
              >
                <Option value="todos">Todos</Option>
                <Option value="pagado">Facturado (INGADO)</Option>
                <Option value="pendiente">Pendiente de Factura</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Estatus de Pago:</div>
              <Select
                value={filtroEstatus}
                onChange={setFiltroEstatus}
                style={{ width: '100%' }}
              >
                <Option value="todos">Todos</Option>
                <Option value="pagado">Pagado</Option>
                <Option value="en proceso de pago">En Proceso de Pago</Option>
                <Option value="pendiente">Pendiente</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={24} md={8} lg={12}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Buscar en todas las cuentas:</div>
              <Search
                placeholder="Buscar por ID, número de registro, paciente, factura..."
                allowClear
                enterButton={<SearchOutlined />}
                value={searchTextCuentas}
                onChange={(e) => setSearchTextCuentas(e.target.value)}
                onSearch={handleSearchCuentas}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
        </Row>
        
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space>
              <Button onClick={handleResetFilters}>
                Limpiar Filtros
              </Button>
              <span style={{ color: '#888' }}>
                Mostrando {filteredCuentas.length} de {cuentas.length} registros
              </span>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columnsCuentas}
        dataSource={filteredCuentas}
        loading={loadingCuentas}
        scroll={{ x: 1500 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} de ${total} registros`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        bordered
        size="middle"
      />

      {/* Modal para agregar pago */}
      <Modal
        title="Agregar Pago"
        open={isPagoModalOpen}
        onCancel={closePagoModal}
        footer={null}
        width={500}
      >
        {selectedCuenta && (
          <Form
            form={formPago}
            layout="vertical"
            onFinish={handleAddPago}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div><strong>Paciente:</strong></div>
                  <div>{selectedCuenta.paciente}</div>
                </Col>
                <Col span={12}>
                  <div><strong>Número de Registro:</strong></div>
                  <div>{selectedCuenta.numeroRegistro}</div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <div><strong>Total:</strong></div>
                  <div>{formatCurrency(selectedCuenta.precio)}</div>
                </Col>
                <Col span={8}>
                  <div><strong>Pagado:</strong></div>
                  <div>{formatCurrency(selectedCuenta.pagado)}</div>
                </Col>
                <Col span={8}>
                  <div><strong>Por Pagar:</strong></div>
                  <div>{formatCurrency(selectedCuenta.precio - selectedCuenta.pagado)}</div>
                </Col>
              </Row>
            </Card>

            <Form.Item
              name="montoPago"
              label="Monto del Pago"
              rules={[
                { required: true, message: 'Ingresa el monto del pago' },
                {
                  validator: (_, value) => {
                    if (value && value > (selectedCuenta.precio - selectedCuenta.pagado)) {
                      return Promise.reject(new Error('El monto no puede exceder el saldo pendiente'));
                    }
                    if (value && value <= 0) {
                      return Promise.reject(new Error('El monto debe ser mayor a 0'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                placeholder="0.00"
                style={{ width: '100%' }}
                min={0}
                max={selectedCuenta.precio - selectedCuenta.pagado}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
              />
            </Form.Item>

            <Form.Item
              name="tipoPago"
              label="Tipo de Pago"
              rules={[{ required: true, message: 'Selecciona el tipo de pago' }]}
            >
              <Select placeholder="Selecciona el tipo de pago">
                <Option value={1}>Efectivo</Option>
                <Option value={2}>Tarjeta de crédito</Option>
                <Option value={3}>Transferencia bancaria</Option>
                <Option value={4}>Recibo</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="descripcion"
              label="Descripción (Opcional)"
            >
              <Input.TextArea placeholder="Descripción del pago" rows={2} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={closePagoModal}>
                  Cancelar
                </Button>
                <Button type="primary" htmlType="submit">
                  Registrar Pago
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
 <Modal
        title="Detalles de Pagos"
        open={isDetallesModalOpen}
        onCancel={closeDetallesModal}
        footer={[
          <Button key="close" onClick={closeDetallesModal}>
            Cerrar
          </Button>
        ]}
        width={600}
      >
        {selectedCuenta && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Paciente">{selectedCuenta.paciente}</Descriptions.Item>
              <Descriptions.Item label="Número de Registro">{selectedCuenta.numeroRegistro}</Descriptions.Item>
              <Descriptions.Item label="Total">{formatCurrency(selectedCuenta.precio)}</Descriptions.Item>
              <Descriptions.Item label="Pagado">{formatCurrency(selectedCuenta.pagado)}</Descriptions.Item>
              <Descriptions.Item label="Saldo Pendiente">
                {formatCurrency(selectedCuenta.precio - selectedCuenta.pagado)}
              </Descriptions.Item>
              <Descriptions.Item label="Estatus">
                <Tag color={selectedCuenta.estatus === 'pagado' ? 'green' : 'orange'}>
                  {selectedCuenta.estatus.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedCuenta.pagos && selectedCuenta.pagos.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>Historial de Pagos</h4>
                <Table
                  size="small"
                  dataSource={selectedCuenta.pagos}
                  columns={[
                    { title: 'Fecha', dataIndex: 'fechaPago', key: 'fechaPago', 
                      render: (fecha: string) => new Date(fecha).toLocaleDateString('es-ES') },
                    { title: 'Monto', dataIndex: 'monto', key: 'monto', 
                      render: (monto: number) => formatCurrency(monto) },
                    { title: 'Tipo', dataIndex: 'tipoPago', key: 'tipoPago' },
                    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
                  ]}
                  pagination={false}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Modal para actualizar factura */}
      <Modal
        title="Actualizar Factura"
        open={isFacturaModalOpen}
        onCancel={closeFacturaModal}
        footer={null}
        width={400}
      >
        {selectedCuenta && (
          <Form
            form={formFactura}
            layout="vertical"
            onFinish={handleUpdateFactura}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={24}>
                  <div><strong>Paciente:</strong></div>
                  <div>{selectedCuenta.paciente}</div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={24}>
                  <div><strong>Número de Registro:</strong></div>
                  <div>{selectedCuenta.numeroRegistro}</div>
                </Col>
              </Row>
            </Card>

            <Form.Item
              name="factura"
              label="Número de Factura"
              rules={[{ required: true, message: 'Ingresa el número de factura' }]}
            >
              <Input placeholder="Ej: INGADO, FACT-001, etc." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={closeFacturaModal}>
                  Cancelar
                </Button>
                <Button type="primary" htmlType="submit">
                  Actualizar Factura
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

function setIsDetallesModalOpen(arg0: boolean) {
  throw new Error('Function not implemented.');
}
