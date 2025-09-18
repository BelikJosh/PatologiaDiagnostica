// src/pages/pacientes/PacienteForm.tsx
import { Button, DatePicker, Form, Input, Select, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useState } from 'react';
import { PacienteService } from '../../services/PacienteService';

interface PacienteFormProps {
  onSuccess: () => void;
}

export const PacienteForm: React.FC<PacienteFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const result = await PacienteService.crearPaciente({
        nombre: values.nombre,
        apellidoPat: values.apellidoPat,
        apellidoMat: values.apellidoMat || '',
        telefono: values.telefono,
        email: values.email || '',
        direccion: values.direccion || '',
        sexo: values.sexo || '',
        fechaNacimiento: values.fechaNacimiento?.format('YYYY-MM-DD') || '',
      });

      if (result.success) {
        message.success('Paciente registrado correctamente');
        form.resetFields();
        onSuccess();
      } else {
        message.error(result.error || 'Error al registrar paciente');
      }
    } catch (error) {
      message.error('Error al registrar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Nombre"
        name="nombre"
        rules={[{ required: true, message: 'El nombre es requerido' }]}
      >
        <Input placeholder="Nombre(s) del paciente" />
      </Form.Item>

      <Form.Item
        label="Primer apellido"
        name="apellidoPat"
        rules={[{ required: true, message: 'El primer apellido es requerido' }]}
      >
        <Input placeholder="Primer apellido del paciente" />
      </Form.Item>

      <Form.Item label="Segundo apellido" name="apellidoMat">
        <Input placeholder="Segundo apellido del paciente" />
      </Form.Item>

      <Form.Item
        label="Teléfono"
        name="telefono"
        rules={[
          {
            pattern: /^\d{10}$/,
            required: true,
            message: 'El teléfono debe tener 10 dígitos',
          },
        ]}
      >
        <Input maxLength={10} placeholder="10 dígitos" />
      </Form.Item>

      <Form.Item label="Correo electrónico" name="email">
        <Input type="email" />
      </Form.Item>

      <Form.Item label="Fecha de nacimiento" name="fechaNacimiento">
        <DatePicker format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Dirección" name="direccion">
        <TextArea rows={3} />
      </Form.Item>

      <Form.Item label="Sexo" name="sexo">
        <Select
          options={[
            { value: 'M', label: 'Masculino' },
            { value: 'F', label: 'Femenino' },
          ]}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar Paciente
        </Button>
      </Form.Item>
    </Form>
  );
};