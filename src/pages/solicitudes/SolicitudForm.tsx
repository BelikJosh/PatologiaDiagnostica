// src/components/solicitudes/SolicitudForm.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  AutoComplete,
  Button,
  DatePicker,
  Form,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  message,
  Modal,
  Descriptions,
  Tag,
  Input
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import dayjs from 'dayjs';
import { SolicitudService, Solicitud } from '../../services/solicitudService';
import { SearchService } from '../../services/searchService';
import { DoctorService } from '../../services/doctorService';
import { PacienteService } from '../../services/PacienteService';

const dateFormat = 'DD/MM/YYYY';

type Props = {
  onNewPatient: CallableFunction;
  onNewDoctor: CallableFunction;
  onSuccess?: CallableFunction;
};

// Reemplaza la importación de lodash con esta función
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

export const SolicitudForm = ({ onNewPatient, onNewDoctor, onSuccess }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [doctoresOptions, setDoctoresOptions] = useState<{ value: string; label: string }[]>([]);
  const [pacientesOptions, setPacientesOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchingDoctores, setSearchingDoctores] = useState(false);
  const [searchingPacientes, setSearchingPacientes] = useState(false);
  const [pacienteExistenteModal, setPacienteExistenteModal] = useState(false);
  const [pacienteExistenteInfo, setPacienteExistenteInfo] = useState<any>(null);
  const [doctoresLista, setDoctoresLista] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<any>(null);

  // Cargar lista de doctores al iniciar
  useEffect(() => {
    cargarDoctores();
  }, []);

  const cargarDoctores = async () => {
    try {
      const result = await DoctorService.getDoctores();
      if (result.success && result.data) {
        const doctores = result.data.map((doctor: any) => ({
          value: `${doctor.Nombre} ${doctor.PrimerApellido} ${doctor.SegundoApellido || ''}`.trim(),
          label: `${doctor.Nombre} ${doctor.PrimerApellido} ${doctor.SegundoApellido || ''}`.trim()
        }));
        setDoctoresLista(doctores);
        setDoctoresOptions(doctores);
      }
    } catch (error) {
      console.error('Error cargando doctores:', error);
    }
  };

  // Debounce para búsqueda de doctores
  const debouncedSearchDoctores = useCallback(
    debounce(async (searchText: string) => {
      if (searchText.length < 2) {
        setDoctoresOptions(doctoresLista);
        setSearchingDoctores(false);
        return;
      }

      setSearchingDoctores(true);
      try {
        const filtered = doctoresLista.filter(doctor =>
          doctor.value.toLowerCase().includes(searchText.toLowerCase())
        );
        setDoctoresOptions(filtered);
      } catch (error) {
        console.error('Error en búsqueda de doctores:', error);
        message.error('Error al buscar doctores');
      } finally {
        setSearchingDoctores(false);
      }
    }, 300),
    [doctoresLista]
  );

  // Debounce para búsqueda de pacientes
  const debouncedSearchPacientes = useCallback(
    debounce(async (searchText: string) => {
      if (searchText.length < 2) {
        setPacientesOptions([]);
        setSearchingPacientes(false);
        return;
      }

      setSearchingPacientes(true);
      try {
        const results = await SearchService.searchPacientes(searchText);
        setPacientesOptions(results);
      } catch (error) {
        console.error('Error en búsqueda de pacientes:', error);
        message.error('Error al buscar pacientes');
      } finally {
        setSearchingPacientes(false);
      }
    }, 500),
    []
  );

  // Validar si el paciente ya existe
  const validarPacienteExistente = async (nombrePaciente: string) => {
    try {
      const result = await PacienteService.buscarPacientesPorNombre(nombrePaciente);
      if (result.success && result.data && result.data.length > 0) {
        // Encontramos pacientes existentes
        const paciente = result.data[0];
        setPacienteExistenteInfo(paciente);
        setPacienteExistenteModal(true);
        return true;
      }
    } catch (error) {
      console.error('Error validando paciente:', error);
    }
    return false;
  };

  const onFinish = async (values: any) => {
    // Guardar los valores del formulario para usarlos después de la validación
    setFormValues(values);
    
    // Validar si el paciente ya existe
    const pacienteExiste = await validarPacienteExistente(values.pacienteNombre);
    if (pacienteExiste) {
      // Mostrar modal de confirmación, no continuar con el guardado aún
      return;
    }

    // Si no existe paciente, continuar con el guardado
    await guardarSolicitud(values);
  };

  const guardarSolicitud = async (values: any) => {
  setLoading(true);
  
  try {
    const tipoEstudio = values.tipoEstudio === 1 ? 'Citologia' : 'Biopsia';
    
    const fechaRecepcion = values.fechaRecepcion 
      ? dayjs(values.fechaRecepcion).format('YYYY-MM-DD') 
      : null;

    const solicitud: Solicitud = {
      requiereFirma: values.firma || false,
      tipoEstudio: tipoEstudio,
      medicoSolicitante: values.medicoSolicitante,
      pacienteNombre: values.pacienteNombre,
      fechaRecepcion: fechaRecepcion,
      procedencia: values.procedencia,
      precioEstudio: values.precioEstudio || 0,
      anticipo: values.anticipo || 0,
      tipoPago: values.tipoPago,
      observacionesPago: values.observacionesPago,
      datosClinicos: values.datosClinicos,
      estatus: 'Iniciado', // Cambiado de 'Pendiente' a 'Iniciado'
      idEstatusEstudio: 1, // Agregado: 1 = Iniciado
      // Agrega estos campos si existen en tu formulario
      telefonoPaciente: values.telefonoPaciente,
      sexoPaciente: values.sexoPaciente
    };

    const result = await SolicitudService.createSolicitud(solicitud);
    
    if (result.success) {
      message.success('Solicitud guardada exitosamente');
      form.resetFields();
      form.setFieldsValue({
        firma: false,
        tipoEstudio: 1,
        fechaRecepcion: dayjs()
      });
      onSuccess?.();
    } else {
      message.error(result.error || 'Error al guardar la solicitud');
    }
  } catch (error) {
    console.error('Error:', error);
    message.error('Error al guardar la solicitud');
  } finally {
    setLoading(false);
    setFormValues(null);
  }
};

  const handleConfirmarPacienteExistente = () => {
    setPacienteExistenteModal(false);
    // Continuar con el guardado usando los valores guardados
    if (formValues) {
      guardarSolicitud(formValues);
    }
  };

  const handleCancelarPacienteExistente = () => {
    setPacienteExistenteModal(false);
    setFormValues(null);
    // Opcional: limpiar el campo del paciente
    form.setFieldsValue({ pacienteNombre: '' });
  };

  const handleSearchDoctores = (searchText: string) => {
    debouncedSearchDoctores(searchText);
  };

  const handleSearchPacientes = (searchText: string) => {
    debouncedSearchPacientes(searchText);
  };

  const handleSelectDoctor = (value: string) => {
    form.setFieldValue('medicoSolicitante', value);
  };

  const handleSelectPaciente = (value: string) => {
    form.setFieldValue('pacienteNombre', value);
  };

  return (
    <>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
        initialValues={{
          firma: false,
          tipoEstudio: 1,
          fechaRecepcion: dayjs() // Solo para mostrar en el formulario, no para guardar
        }}
      >
        <Form.Item label="REQUIERE FIRMA" name="firma" valuePropName="checked">
          <Switch checkedChildren="SI" unCheckedChildren="NO" />
        </Form.Item>

        <Form.Item label="TIPO DE ESTUDIO" name="tipoEstudio" rules={[{ required: true, message: 'El tipo de estudio es requerido' }]}>
          <Radio.Group>
            <Radio value={1}>CITOLOGÍA</Radio>
            <Radio value={2}>BIOPSIA</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="MÉDICO SOLICITANTE" name="medicoSolicitante" rules={[{ required: true, message: 'El médico solicitante es requerido' }]}>
          <Space.Compact style={{ width: '100%' }}>
            <AutoComplete
              options={doctoresOptions}
              placeholder="Escribe el nombre del médico"
              onSearch={handleSearchDoctores}
              onSelect={handleSelectDoctor}
              notFoundContent={searchingDoctores ? "Buscando..." : "Escribe al menos 2 caracteres"}
              style={{ width: '100%' }}
              filterOption={false}
            />
            <Button type="primary" onClick={() => onNewDoctor()}>
              + Nuevo
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item label="NOMBRE DEL PACIENTE" name="pacienteNombre" rules={[{ required: true, message: 'El nombre del paciente es requerido' }]}>
          <Space.Compact style={{ width: '100%' }}>
            <AutoComplete
              options={pacientesOptions}
              placeholder="Escribe el nombre del paciente"
              onSearch={handleSearchPacientes}
              onSelect={handleSelectPaciente}
              notFoundContent={searchingPacientes ? "Buscando..." : "Escribe al menos 2 caracteres"}
              style={{ width: '100%' }}
              filterOption={false}
            />
            <Button type="primary" onClick={() => onNewPatient()}>
              + Nuevo
            </Button>
          </Space.Compact>
        </Form.Item>
     
<Form.Item
  label="Teléfono del Paciente"
  name="telefonoPaciente"
  rules={[{ pattern: /^\d{10}$/, message: '10 dígitos' }]}
>
  <Input maxLength={10} placeholder="Teléfono" />
</Form.Item>

<Form.Item label="Sexo del Paciente" name="sexoPaciente">
  <Select
    options={[
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' },
    ]}
  />
</Form.Item>

        <Form.Item label="FECHA DE RECEPCIÓN" name="fechaRecepcion">
          <DatePicker 
            format={dateFormat} 
            style={{ width: '100%' }} 
            // Permitir seleccionar cualquier fecha, incluyendo pasadas
            disabledDate={(current) => {
              // Puedes agregar validaciones de fecha si es necesario
              return false;
            }}
          />
        </Form.Item>

        <Form.Item label="PROCEDENCIA" name="procedencia">
          <Select
            placeholder="Selecciona la procedencia"
            options={[
              { value: 'Directo', label: 'Directo' },
              { value: 'Laboratorio', label: 'Laboratorio' },
              { value: 'Consulta', label: 'Consulta' },
              { value: 'Hospital', label: 'Hospital' },
            ]}
          />
        </Form.Item>

        <Form.Item label="PRECIO DE ESTUDIO" name="precioEstudio" rules={[{ required: true, message: 'El precio es requerido' }]}>
          <InputNumber
            addonBefore="$"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
            placeholder="Precio en moneda nacional"
            style={{ width: '100%' }}
            min={0}
          />
        </Form.Item>

        <Form.Item label="ANTICIPO" name="anticipo" rules={[{ required: true, message: 'El anticipo es requerido' }]}>
          <InputNumber
            addonBefore="$"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
            placeholder="Precio en moneda nacional"
            style={{ width: '100%' }}
            min={0}
          />
        </Form.Item>

        <Form.Item label="TIPO DE PAGO" name="tipoPago">
          <Select
            placeholder="Selecciona el tipo de pago"
            options={[
              { value: 'Transferencia', label: 'Transferencia' },
              { value: 'Efectivo', label: 'Efectivo' },
              { value: 'Recibo', label: 'Recibo' },
            ]}
          />
        </Form.Item>

        <Form.Item label="OBSERVACIONES DEL PAGO" name="observacionesPago">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="DATOS CLINICOS" name="datosClinicos">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Guardar
            </Button>
            <Button onClick={() => form.resetFields()}>
              Cancelar
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Modal para paciente existente */}
      <Modal
        title="⚠️ Paciente Existente"
        open={pacienteExistenteModal}
        onCancel={handleCancelarPacienteExistente}
        footer={[
          <Button key="cancel" onClick={handleCancelarPacienteExistente}>
            Cancelar
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmarPacienteExistente}>
            Continuar de todos modos
          </Button>
        ]}
        width={600}
      >
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Paciente encontrado">
            <Tag color="orange">{pacienteExistenteInfo?.NombreCompleto || pacienteExistenteInfo?.Nombre}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Registros anteriores">
            Este paciente ya tiene registros previos en el sistema.
          </Descriptions.Item>
          <Descriptions.Item label="Recomendación">
            Verifique si es el mismo paciente antes de continuar.
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};