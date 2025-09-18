// src/components/doctores/DoctorForm.tsx
import { Button, Form, Input, message } from 'antd';
import FormItem from 'antd/es/form/FormItem';
import TextArea from 'antd/es/input/TextArea';
import { useState } from 'react';
import { DoctorService } from '../../services/doctorService';

interface DoctorFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DoctorForm = ({ onSuccess, onCancel }: DoctorFormProps) => {
  const [saveDoctor, setSaveDoctor] = useState(false);
  const [form] = Form.useForm();

  const onSaveDoctor = async (values: any) => {
    setSaveDoctor(true);
    try {
      const result = await DoctorService.createDoctor(values);
      
      if (result.success) {
        message.success('Doctor guardado exitosamente');
        form.resetFields();
        if (onSuccess) onSuccess();
      } else {
        message.error(result.error || 'Error al guardar el doctor');
      }
    } catch (error) {
      console.error(error);
      message.error('Error al guardar el doctor');
    } finally {
      setSaveDoctor(false);
    }
  };

  return (
    <>
      <Form
        layout="horizontal"
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 24 }}
        form={form}
        onFinish={onSaveDoctor}
      >
        <Form.Item
          label="Nombre"
          name="nombre"
          rules={[
            {
              required: true,
              message: 'El nombre es requerido',
            },
          ]}
        >
          <Input type="text" placeholder="Nombre(s) del médico" />
        </Form.Item>
        <Form.Item
          label="Primer apellido"
          name="primerApellido"
          rules={[
            { required: true, message: 'El primer apellido es requerido' },
          ]}
        >
          <Input type="text" placeholder="Primer apellido del médico" />
        </Form.Item>
        <Form.Item label="Segundo apellido" name="segundoApellido">
          <Input type="text" placeholder="Segundo apellido del médico" />
        </Form.Item>
        <Form.Item
          label="Teléfono"
          name="telefono"
          rules={[
            {
              pattern: /\d{10}/g,
              required: true,
              message: 'El teléfono es requerido a 10 dígitos',
            },
          ]}
        >
          <Input
            maxLength={10}
            placeholder="10 dígitos"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Correo" name="email">
          <Input type="email" />
        </Form.Item>
        <Form.Item label="Especialidad" name="especialidad">
          <Input placeholder="Especialidad del médico" />
        </Form.Item>
        <Form.Item label="Domicilio" name="direccion">
          <TextArea />
        </Form.Item>
        <FormItem>
          <Button type="primary" htmlType="submit" loading={saveDoctor}>
            Guardar
          </Button>
          {onCancel && (
            <Button style={{ marginLeft: 8 }} onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </FormItem>
      </Form>
    </>
  );
};