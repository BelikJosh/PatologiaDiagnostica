// src/components/solicitudes/SolicitudesEventos.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Modal, 
  Input, 
  message, 
  Space,
  Spin,
  Tag
} from 'antd';
import { useParams } from 'react-router-dom';
import { SolicitudService } from '../../services/solicitudService';
import { DoctorService } from '../../services/doctorService';
import { PacienteService } from '../../services/PacienteService';
import { CicloVidaSolicitud } from './CicloVidaSolicitud';
import { ModalEstudioMacroscopico } from './Modals/ModalEstudioMacroscopico';
import { ModalEstudioMicroscopico } from './Modals/ModalEstudioMicroscopico';

const { Title, Text } = Typography;

interface Solicitud {
  id: string;
  numeroRegistro: string;
  fechaRecepcion: string;
  idEstatusEstudio: number;
  estudioEspecial: boolean;
  fechaMacro?: string;
  fechaMicro?: string;
  factura?: string;
  pacienteId?: string;
  medicoId?: string;
}

interface Paciente {
  id: string;
  nombre: string;
  apellidoPat: string;
  apellidoMat: string;
  telefono: string;
  direccion: string;
  sexo: string;
  fechaNacimiento: string;
  // Campos adicionales que podrían venir del servicio
  Telefono?: string;
  Direccion?: string;
  Sexo?: string;
  FechaNacimiento?: string;
}

interface Doctor {
  id: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  email: string;
  direccion: string;
  especialidad: string;
  // Campos adicionales que podrían venir del servicio
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  Especialidad?: string;
}

export const SolicitudesEventos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [factura, setFactura] = useState('');
  const [saving, setSaving] = useState(false);

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
const [modalEstudioMacroVisible, setModalEstudioMacroVisible] = useState(false);
const [modalEstudioMicroVisible, setModalEstudioMicroVisible] = useState(false);
const [modalEstudioEspecialVisible, setModalEstudioEspecialVisible] = useState(false);
const [modalCitologiaVisible, setModalCitologiaVisible] = useState(false);

useEffect(() => {
  if (id) {
    const cargarDatos = async () => {
      // Solo diagnóstico para debugging, puedes comentarlo después
      const resultado = await SolicitudService.diagnosticarSolicitudEspecifica(id);
      console.log('🎯 Diagnóstico específico para ID:', id, resultado);
      
      // Cargar los datos principales
      await cargarDatosSolicitud();
    };
    
    cargarDatos();
  }
}, [id]); // Solo se ejecuta cuando cambia el ID

 const handleIniciarMacroscopico = () => {
  setModalEstudioMacroVisible(true);
};

const handleIniciarMicroscopico = () => {
  setModalEstudioMicroVisible(true);
};

const handleDescargarEditable = () => {
  // Lógica para descargar el documento editable
  message.info('Descargando documento editable...');
};

const handleSaveEstudioMicroscopico = async (data: any) => {
  try {
    setLoading(true);
    
    // Obtener ID del médico patólogo (deberías tener esto de tu sistema de autenticación)
    const usuarioId = 'medico123'; // Reemplazar con lógica real
    
    const estudioData = {
      solicitudId: solicitud.id,
      descripciones: {
        requiereFirma: data.requiereFirma,
        borrador: data.borrador,
        tipoEstudio: data.tipoEstudio,
        descripcionMicroscopica: data.descripcionMicroscopica
      },
      diagnostico: data.diagnostico,
      esMaligno: data.esMaligno,
      imagenes: data.archivos,
      usuarioId: usuarioId
    };

    const result = await SolicitudService.guardarEstudioMicroscopico(estudioData);
    
    if (result.success) {
      setSolicitud(prev => prev ? { 
        ...prev, 
        idEstatusEstudio: 3, // EN DIAGNÓSTICO
        fechaMicro: new Date().toISOString()
      } : null);
      
      setModalEstudioMicroVisible(false);
      message.success('Estudio microscópico guardado correctamente');
      await cargarDatosSolicitud();
    } else {
      message.error(result.error || 'Error al guardar el estudio');
    }
  } catch (error) {
    console.error('Error guardando estudio microscópico:', error);
    message.error('Error al guardar el estudio microscópico');
  } finally {
    setLoading(false);
  }
};

// Función para subir documento definitivo
const handleSubirDefinitivo = async (file: File) => {
  try {
    setLoading(true);
    const result = await SolicitudService.subirDefinitivo({
      solicitudId: solicitud.id,
      archivo: file,
      usuarioId: 'user123'
    });

    if (result.success) {
      setSolicitud(prev => prev ? { 
        ...prev, 
        idEstatusEstudio: 4, // 👈 Avanza a FINALIZADO
        fechaFinalizado: new Date().toISOString()
      } : null);

      message.success('Documento definitivo subido correctamente');
      await cargarDatosSolicitud();
    } else {
      message.error(result.error || 'Error al subir el documento');
    }
  } catch (error) {
    console.error('Error subiendo definitivo:', error);
    message.error('Error al subir el documento definitivo');
  } finally {
    setLoading(false);
  }
};



const handleRegistrarEntrega = () => {
  // Lógica para registrar entrega
  message.info('Registrando entrega...');
};

const handleEstudioEspecial = () => {
  setModalEstudioEspecialVisible(true);
};

const handleCitologia = () => {
  setModalCitologiaVisible(true);
};



// En handleSaveEstudioMacroscopico de SolicitudesEventos.tsx
const handleSaveEstudioMacroscopico = async (data: any) => {
  try {
    setLoading(true);
    const usuarioId = 'user123';

    const archivosMetadata = data.archivos.map((file: any) => ({
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type
    }));

    const estudioData = {
      solicitudId: solicitud.id,
      descripcionMacroscopica: data.descripcionMacroscopica,
      requiereFirma: data.requiereFirma,
      archivos: archivosMetadata,
      usuarioId: usuarioId
    };

    const result = await SolicitudService.guardarEstudioMacroscopico(estudioData);

    if (result.success) {
      setSolicitud(prev => prev ? { 
        ...prev, 
        idEstatusEstudio: 2, // 👈 Avanza al siguiente paso
        fechaMacro: new Date().toISOString()
      } : null);

      setModalEstudioMacroVisible(false); // 👈 Cierra el modal
      message.success('Estudio macroscópico guardado correctamente');
      await cargarDatosSolicitud(); // 👈 Refresca los datos
    } else {
      message.error(result.error || 'Error al guardar el estudio');
    }
  } catch (error) {
    console.error('Error guardando estudio macroscópico:', error);
    message.error('Error al guardar el estudio macroscópico');
  } finally {
    setLoading(false);
  }
};

// Agrega esta función en tu componente
const buscarMedicoPorNombre = async (nombreMedico: string) => {
  if (!nombreMedico) return null;
  
  try {
    const result = await DoctorService.getDoctores();
    if (result.success && result.data) {
      // Buscar médico por nombre (búsqueda aproximada)
      const medicoEncontrado = result.data.find((doctor: any) => {
        const nombreCompleto = `${doctor.Nombre || ''} ${doctor.PrimerApellido || ''} ${doctor.SegundoApellido || ''}`.trim();
        return nombreCompleto.includes(nombreMedico) || nombreMedico.includes(nombreCompleto);
      });
      
      if (medicoEncontrado) {
        console.log('Médico encontrado por nombre:', medicoEncontrado);
        return normalizarDatosDoctor(medicoEncontrado);
      }
    }
  } catch (error) {
    console.error('Error buscando médico por nombre:', error);
  }
  return null;
};

// Modifica cargarDatosSolicitud para buscar médico por nombre si no hay ID
const cargarDatosSolicitud = async () => {
  try {
    setLoading(true);
    
    const solicitudResult = await SolicitudService.getSolicitudById(id!);
    
    if (solicitudResult.success && solicitudResult.data) {
      setSolicitud(solicitudResult.data);
      
      const pacienteId = solicitudResult.data.pacienteId || solicitudResult.data.PacienteId;
      const medicoId = solicitudResult.data.medicoId || solicitudResult.data.MedicoId;
      const medicoNombre = solicitudResult.data.medicoSolicitante || solicitudResult.data.MedicoSolicitante;
      
      console.log('IDs encontrados:', { pacienteId, medicoId, medicoNombre });
      
      // Cargar paciente
      if (pacienteId) {
        setLoadingPaciente(true);
        try {
          const pacienteResult = await PacienteService.buscarPacientePorID(pacienteId);
          if (pacienteResult.success && pacienteResult.data) {
            const pacienteNormalizado = normalizarDatosPaciente(pacienteResult.data);
            setPaciente(pacienteNormalizado);
          }
        } catch (error) {
          console.error('Error cargando paciente:', error);
        } finally {
          setLoadingPaciente(false);
        }
      }
      
      // Cargar médico - primero por ID, si no por nombre
      setLoadingDoctor(true);
      try {
        let doctorData = null;
        
        if (medicoId) {
          const doctorResult = await DoctorService.getDoctorByID(medicoId);
          if (doctorResult.success && doctorResult.data) {
            doctorData = normalizarDatosDoctor(doctorResult.data);
          }
        }
        
        // Si no se encontró por ID, buscar por nombre
        if (!doctorData && medicoNombre) {
          doctorData = await buscarMedicoPorNombre(medicoNombre);
        }
        
        if (doctorData) {
          setDoctor(doctorData);
        } else {
          console.warn('Médico no encontrado');
        }
      } catch (error) {
        console.error('Error cargando médico:', error);
      } finally {
        setLoadingDoctor(false);
      }
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
    message.error('Error al cargar los datos de la solicitud');
  } finally {
    setLoading(false);
  }
};


const normalizarDatosPaciente = (pacienteData: any): Paciente => {
  console.log('Datos crudos del paciente:', pacienteData);
  
  return {
    id: pacienteData.id || pacienteData.Id || pacienteData.ID,
    nombre: pacienteData.nombre || pacienteData.Nombre || pacienteData.NOMBRE || '',
    apellidoPat: pacienteData.apellidoPat || pacienteData.ApellidoPat || pacienteData.APELLIDO_PAT || '',
    apellidoMat: pacienteData.apellidoMat || pacienteData.ApellidoMat || pacienteData.APELLIDO_MAT || '',
    telefono: pacienteData.telefono || pacienteData.Telefono || pacienteData.TELEFONO || pacienteData.phone || '',
    direccion: pacienteData.direccion || pacienteData.Direccion || pacienteData.DIRECCION || pacienteData.address || '',
    sexo: pacienteData.sexo || pacienteData.Sexo || pacienteData.SEXO || pacienteData.gender || '',
    fechaNacimiento: pacienteData.fechaNacimiento || pacienteData.FechaNacimiento || pacienteData.FECHA_NACIMIENTO || pacienteData.birthDate || ''
  };
};
const normalizarDatosDoctor = (doctorData: any): Doctor => {
  return {
    id: doctorData.id || doctorData.Id,
    nombre: doctorData.nombre || doctorData.Nombre,
    primerApellido: doctorData.primerApellido || doctorData.PrimerApellido,
    segundoApellido: doctorData.segundoApellido || doctorData.SegundoApellido || '',
    telefono: doctorData.telefono || doctorData.Telefono || '',
    email: doctorData.email || doctorData.Email || '',
    direccion: doctorData.direccion || doctorData.Direccion || '',
    especialidad: doctorData.especialidad || doctorData.Especialidad || ''
  };
};
  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return fecha; // Si hay error, devolver la fecha original
    }
  };


const handleVerEstudioMacroscopico = () => {
  // Lógica para ver el estudio macroscópico existente
  message.info('Abriendo estudio macroscópico...');
  // Aquí podrías abrir un modal de solo lectura o navegar a otra página
};

const handleVerEstudioMicroscopico = () => {
  // Lógica para ver el estudio microscópico existente
  message.info('Abriendo estudio microscópico...');
};
  const handleSaveFactura = async () => {
    if (!solicitud || !factura.trim()) {
      message.warning('Ingrese un número de factura válido');
      return;
    }

    try {
      setSaving(true);
      const result = await SolicitudService.actualizarFactura(solicitud.id, factura);
      
      if (result.success) {
        message.success('Factura actualizada correctamente');
        setModalVisible(false);
        setFactura('');
        cargarDatosSolicitud(); // Recargar datos
      } else {
        message.error(result.error || 'Error al guardar la factura');
      }
    } catch (error) {
      console.error('Error guardando factura:', error);
      message.error('Error al guardar la factura');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
<Spin size="large">
  <div style={{ marginTop: '8px' }}>Cargando datos de la solicitud...</div>
</Spin>      </div>
    );
  }

  if (!solicitud) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text type="danger">No se encontraron los datos de la solicitud</Text>
          <div style={{ marginTop: '16px' }}>
            <Button onClick={() => window.history.back()}>
              Volver atrás
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const nombreCompletoPaciente = paciente ? 
    `${paciente.nombre} ${paciente.apellidoPat} ${paciente.apellidoMat}` : 
    'Paciente no encontrado';
  
  const nombreCompletoDoctor = doctor ? 
    `${doctor.nombre} ${doctor.primerApellido} ${doctor.segundoApellido}` : 
    'Médico no encontrado';

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>Eventos de la Solicitud</Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={3}>Solicitud {solicitud.numeroRegistro}</Title>
                <Text strong>Fecha: </Text>
                <Text>{formatFecha(solicitud.fechaRecepcion)}</Text>
              </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
              <Col span={10}>
                <Card 
                  title="Información del Paciente" 
                  size="small"
                  loading={loadingPaciente}
                >
                  {paciente ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Paciente: </Text>
                        <Text>{nombreCompletoPaciente}</Text>
                      </div>
                   s
<div>
  <Text strong>Teléfono: </Text>
  <Text>{paciente.telefono || 'No especificado'}</Text>
</div>
<div>
  <Text strong>Dirección: </Text>
  <Text>{paciente.direccion || 'No especificado'}</Text>
</div>
<div>
  <Text strong>Sexo: </Text>
  <Text>{paciente.sexo || 'No especificado'}</Text>
</div>
<div>
  <Text strong>F. Nacimiento: </Text>
  <Text>{paciente.fechaNacimiento || 'No especificado'}</Text>
</div>
                    </Space>
                  ) : (
                    <Text type="secondary">No se encontró información del paciente</Text>
                  )}
                </Card>
              </Col>

              <Col span={14}>
                <Card 
                  title="Información del Médico" 
                  size="small"
                  loading={loadingDoctor}
                >
                  {doctor ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Nombre del Médico: </Text>
                        <Text>{nombreCompletoDoctor}</Text>
                      </div>
                      <div>
  <Text strong>Teléfono: </Text>
  <Text>{doctor.telefono || 'No especificado'}</Text>
</div>
<div>
  <Text strong>Email: </Text>
  <Text>{doctor.email || 'No especificado'}</Text>
</div>
<div>
  <Text strong>Dirección: </Text>
  <Text>{doctor.direccion || 'No especificado'}</Text>
</div>
<div>
  <Text strong>Especialidad: </Text>
  <Text>{doctor.especialidad || 'No especificado'}</Text>
</div>
                    </Space>
                  ) : (
                    <Text type="secondary">No se encontró información del médico</Text>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
              <Col span={24}>
                <Card>
                  <Title level={4}>Agregar número de factura:</Title>
                  <Button 
                    type="primary" 
                    onClick={() => setModalVisible(true)}
                    disabled={!solicitud}
                  >
                    Agregar
                  </Button>
                  
                  {solicitud.factura && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>Factura actual: </Text>
                      <Tag color="green">{solicitud.factura}</Tag>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <CicloVidaSolicitud
  solicitud={solicitud}
  onIniciarMacroscopico={handleIniciarMacroscopico}
  onIniciarMicroscopico={handleIniciarMicroscopico}
  onDescargarEditable={handleDescargarEditable}
  onSubirDefinitivo={handleSubirDefinitivo}
  onRegistrarEntrega={handleRegistrarEntrega}
  onRegistrarFactura={() => setModalVisible(true)}
  onEstudioEspecial={handleEstudioEspecial}
  onCitologia={handleCitologia}
  onVerEstudioMacroscopico={handleVerEstudioMacroscopico}
  onVerEstudioMicroscopico={handleVerEstudioMicroscopico}
/>

<ModalEstudioMacroscopico
  visible={modalEstudioMacroVisible}
  onCancel={() => setModalEstudioMacroVisible(false)}
  onSave={handleSaveEstudioMacroscopico}
  solicitudId={solicitud.id}
/>
<ModalEstudioMicroscopico
  visible={modalEstudioMicroVisible}
  onCancel={() => setModalEstudioMicroVisible(false)}
  onSave={handleSaveEstudioMicroscopico}
  solicitudId={solicitud.id}
/>
          </Card>
        </Col>
      </Row>

      {/* Modal para agregar factura */}
      <Modal
        title="Agregar Número Factura"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setFactura('');
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setModalVisible(false);
            setFactura('');
          }}>
            Cancelar
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            loading={saving}
            onClick={handleSaveFactura}
          >
            Guardar Factura
          </Button>
        ]}
      >
        <div>
          <Text strong>Número de Factura:</Text>
          <Input
            value={factura}
            onChange={(e) => setFactura(e.target.value)}
            placeholder="Ingrese el número de factura"
            style={{ marginTop: '8px' }}
            disabled={saving}
          />
        </div>
      </Modal>
    </div>
  );
};